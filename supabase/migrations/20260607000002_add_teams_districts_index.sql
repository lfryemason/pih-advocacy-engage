create index idx_teams_congressional_districts
  on public.teams using gin (congressional_districts);
