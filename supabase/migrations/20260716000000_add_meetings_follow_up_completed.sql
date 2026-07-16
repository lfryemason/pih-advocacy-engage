alter table public.meetings
  add column follow_up_completed boolean not null default false;
