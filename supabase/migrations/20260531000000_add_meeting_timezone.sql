alter table public.meetings
  add column meeting_timezone text not null default 'America/New_York';

alter table public.meetings
  alter column meeting_time type time using meeting_time::time;
