-- Troisième domaine (aéronautique et événementiel) et avatars illustrés.
-- À coller dans Supabase > SQL Editor > Run, après 0001.

alter table public.profiles drop constraint if exists profiles_domain_check;
alter table public.profiles add constraint profiles_domain_check check (domain in ('tech', 'marketing', 'air-events'));

alter table public.league_groups drop constraint if exists league_groups_domain_check;
alter table public.league_groups add constraint league_groups_domain_check check (domain in ('tech', 'marketing', 'air-events'));

alter table public.profiles alter column avatar set default 'tech-1';
