-- Montée / descente de ligue chaque lundi (déjà appliquée au projet via le connecteur ; ce fichier garde l'historique).
alter table public.profiles add column if not exists league_tier smallint not null default 1 check (league_tier between 1 and 5);

create or replace function public.join_league() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now())::date;
  dom text;
  tr smallint;
  gid uuid;
begin
  if uid is null then raise exception 'non connecté'; end if;
  select domain, league_tier into dom, tr from public.profiles where id = uid and league_opt_in;
  if dom is null then raise exception 'ligue non activée'; end if;

  select m.group_id into gid from public.league_members m join public.league_groups g on g.id = m.group_id
   where m.user_id = uid and g.week_start = wk;
  if gid is not null then return gid; end if;

  select g.id into gid from public.league_groups g
   where g.week_start = wk and g.tier = tr and g.domain = dom
     and (select count(*) from public.league_members m where m.group_id = g.id) < 20
   order by g.id limit 1;
  if gid is null then
    insert into public.league_groups (week_start, tier, domain) values (wk, tr, dom) returning id into gid;
  end if;
  insert into public.league_members (group_id, user_id) values (gid, uid);
  return gid;
end $$;

-- Fin de semaine : le quart supérieur (avec des points) monte, le quart inférieur descend (groupes de 8 et plus).
create or replace function public.settle_week() returns void
language plpgsql security definer set search_path = public as $$
declare wk date := date_trunc('week', now())::date - 7;
begin
  with pts as (
    select m.group_id, m.user_id, g.tier, coalesce(sum(e.xp), 0) as pts
      from public.league_members m
      join public.league_groups g on g.id = m.group_id and g.week_start = wk
      left join public.xp_events e on e.user_id = m.user_id and e.created_at >= wk and e.created_at < wk + 7
     group by m.group_id, m.user_id, g.tier
  ), ranked as (
    select *, row_number() over (partition by group_id order by pts desc, user_id) as rn, count(*) over (partition by group_id) as n from pts
  )
  update public.profiles p set league_tier = case
      when r.pts > 0 and r.rn <= ceil(r.n / 4.0) then least(r.tier + 1, 5)
      when r.n >= 8 and r.rn > r.n - floor(r.n / 4.0) then greatest(r.tier - 1, 1)
      else r.tier end
    from ranked r where p.id = r.user_id;
end $$;
revoke all on function public.settle_week() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('techlingo-settle-league-week', '5 0 * * 1', 'select public.settle_week()');
