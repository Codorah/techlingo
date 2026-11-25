-- TechLingo: comptes optionnels, points, ligues, amis.
-- À coller dans Supabase > SQL Editor > Run (une seule fois). Idempotent autant que possible.
-- Principe : le client ne peut JAMAIS écrire d'XP. Il appelle record_xp(), qui calcule et plafonne côté serveur.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profils
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Apprenant' check (char_length(display_name) between 2 and 24),
  avatar text not null default 'a01' check (char_length(avatar) <= 32),
  domain text check (domain in ('tech', 'marketing')),
  primary_role text,
  league_opt_in boolean not null default false,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  total_xp integer not null default 0 check (total_xp >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chaque personne lit et modifie son profil, sans toucher à total_xp ni invite_code.
create policy "profil: lecture soi" on public.profiles for select using (auth.uid() = id);
create policy "profil: creation soi" on public.profiles for insert with check (auth.uid() = id);
create policy "profil: modif soi" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (display_name, avatar, domain, primary_role, league_opt_in) on public.profiles to authenticated;

-- Création automatique du profil à l'inscription (Google, e-mail ou anonyme).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'name', 24), ''), 'Apprenant'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- points (XP)
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,                       -- ex. "sit:web-developer-u1-l2"
  kind text not null check (kind in ('lesson', 'course', 'recap', 'practice', 'review')),
  xp integer not null check (xp between 0 and 100),
  accuracy smallint check (accuracy between 0 and 100),
  first_time boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists xp_events_user_week on public.xp_events (user_id, created_at desc);

alter table public.xp_events enable row level security;
create policy "xp: lecture soi" on public.xp_events for select using (auth.uid() = user_id);
-- Aucune politique insert/update/delete : seule record_xp() (security definer) écrit.

-- Barème serveur : l'XP dépend de la maîtrise, pas du volume (voir PRODUCT.md).
create or replace function public.record_xp(p_node_id text, p_kind text, p_accuracy integer, p_first_time boolean)
returns integer language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  base integer;
  gained integer;
  today_total integer;
begin
  if uid is null then raise exception 'non connecté'; end if;
  if p_kind not in ('lesson', 'course', 'recap', 'practice', 'review') then raise exception 'type invalide'; end if;
  if char_length(p_node_id) > 120 then raise exception 'id invalide'; end if;

  base := case p_kind when 'lesson' then 20 when 'recap' then 25 when 'course' then 5 when 'practice' then 8 else 4 end;
  gained := case
    when p_first_time then base + round(base * coalesce(p_accuracy, 0) / 100.0 * 0.5)
    else greatest(1, round(base * 0.2))   -- refaire une leçon facile rapporte peu
  end;

  -- Une seule première fois par étape et par personne.
  if p_first_time and exists (select 1 from public.xp_events where user_id = uid and node_id = p_node_id and first_time) then
    gained := greatest(1, round(base * 0.2));
    p_first_time := false;
  end if;

  -- Plafond journalier : 400 XP.
  select coalesce(sum(xp), 0) into today_total from public.xp_events where user_id = uid and created_at >= date_trunc('day', now());
  gained := greatest(0, least(gained, 400 - today_total));

  insert into public.xp_events (user_id, node_id, kind, xp, accuracy, first_time)
  values (uid, p_node_id, p_kind, gained, p_accuracy, p_first_time);
  update public.profiles set total_xp = total_xp + gained where id = uid;
  return gained;
end $$;

revoke all on function public.record_xp(text, text, integer, boolean) from public, anon;
grant execute on function public.record_xp(text, text, integer, boolean) to authenticated;

-- ---------------------------------------------------------------- ligues hebdomadaires (opt-in)
create table if not exists public.league_tiers (
  tier smallint primary key,
  name_fr text not null
);
insert into public.league_tiers (tier, name_fr) values
  (1, 'Bronze'), (2, 'Argent'), (3, 'Or'), (4, 'Saphir'), (5, 'Diamant')
on conflict (tier) do nothing;

create table if not exists public.league_groups (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  tier smallint not null references public.league_tiers(tier),
  domain text not null check (domain in ('tech', 'marketing'))
);

create table if not exists public.league_members (
  group_id uuid not null references public.league_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (group_id, user_id)
);
create index if not exists league_members_user on public.league_members (user_id);

alter table public.league_tiers enable row level security;
alter table public.league_groups enable row level security;
alter table public.league_members enable row level security;
create policy "tiers: lecture" on public.league_tiers for select using (true);

-- Ligue de la semaine courante pour la personne connectée : groupes de 20 maximum, niveau égal.
create or replace function public.join_league() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now())::date;
  dom text;
  gid uuid;
begin
  if uid is null then raise exception 'non connecté'; end if;
  select domain into dom from public.profiles where id = uid and league_opt_in;
  if dom is null then raise exception 'ligue non activée'; end if;

  select m.group_id into gid from public.league_members m join public.league_groups g on g.id = m.group_id
   where m.user_id = uid and g.week_start = wk;
  if gid is not null then return gid; end if;

  select g.id into gid from public.league_groups g
   where g.week_start = wk and g.tier = 1 and g.domain = dom
     and (select count(*) from public.league_members m where m.group_id = g.id) < 20
   order by g.id limit 1;
  if gid is null then
    insert into public.league_groups (week_start, tier, domain) values (wk, 1, dom) returning id into gid;
  end if;
  insert into public.league_members (group_id, user_id) values (gid, uid);
  return gid;
end $$;

-- Classement du groupe de la semaine : prénom, avatar et XP de la semaine seulement.
create or replace function public.my_league() returns table (rank bigint, user_id uuid, display_name text, avatar text, week_xp bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with mine as (
    select m.group_id from public.league_members m join public.league_groups g on g.id = m.group_id
     where m.user_id = auth.uid() and g.week_start = date_trunc('week', now())::date
  )
  select rank() over (order by coalesce(sum(e.xp), 0) desc), p.id, p.display_name, p.avatar,
         coalesce(sum(e.xp), 0)::bigint, p.id = auth.uid()
    from public.league_members m
    join mine on mine.group_id = m.group_id
    join public.profiles p on p.id = m.user_id
    left join public.xp_events e on e.user_id = p.id and e.created_at >= date_trunc('week', now())
   group by p.id, p.display_name, p.avatar
   order by 1, p.display_name;
$$;
revoke all on function public.join_league(), public.my_league() from public, anon;
grant execute on function public.join_league(), public.my_league() to authenticated;

-- ---------------------------------------------------------------- amis par code d'invitation
create table if not exists public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friendships enable row level security;
create policy "amis: lecture soi" on public.friendships for select using (auth.uid() = user_id);
create policy "amis: retrait soi" on public.friendships for delete using (auth.uid() = user_id);

create or replace function public.add_friend(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select id into fid from public.profiles where invite_code = upper(trim(p_code));
  if fid is null then raise exception 'code inconnu'; end if;
  if fid = auth.uid() then raise exception 'ce code est le tien'; end if;
  insert into public.friendships (user_id, friend_id) values (auth.uid(), fid), (fid, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.my_friends() returns table (user_id uuid, display_name text, avatar text, week_xp bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar, coalesce(sum(e.xp), 0)::bigint
    from public.friendships f
    join public.profiles p on p.id = f.friend_id
    left join public.xp_events e on e.user_id = p.id and e.created_at >= date_trunc('week', now())
   where f.user_id = auth.uid()
   group by p.id, p.display_name, p.avatar
   order by 4 desc;
$$;
revoke all on function public.add_friend(text), public.my_friends() from public, anon;
grant execute on function public.add_friend(text), public.my_friends() to authenticated;

-- ---------------------------------------------------------------- sauvegarde cloud
-- Une ligne par personne : l'export de sauvegarde de l'app (src/data/backup.ts), en JSON.
create table if not exists public.cloud_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  schema_version integer not null,
  updated_at timestamptz not null default now()
);
alter table public.cloud_backups enable row level security;
create policy "sauvegarde: lecture soi" on public.cloud_backups for select using (auth.uid() = user_id);
create policy "sauvegarde: ecriture soi" on public.cloud_backups for insert with check (auth.uid() = user_id);
create policy "sauvegarde: maj soi" on public.cloud_backups for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sauvegarde: suppression soi" on public.cloud_backups for delete using (auth.uid() = user_id);
