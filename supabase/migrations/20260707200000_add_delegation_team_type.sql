-- Add 'delegation' as a team type, consistent with high_school, university, and city.

alter table public.teams drop constraint teams_type_check;
alter table public.teams
  add constraint teams_type_check
  check (type in ('high_school', 'university', 'city', 'delegation'));
