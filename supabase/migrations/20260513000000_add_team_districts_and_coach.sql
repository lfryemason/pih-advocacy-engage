alter table public.teams
  add column congressional_districts text[] not null default '{}';
