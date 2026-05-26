create table public.meetings (
  id                       uuid        primary key default gen_random_uuid(),
  org_id                   text        not null,
  meeting_date             date        not null,
  meeting_time             text,
  representative_id        uuid        not null references public.representatives(id),
  congressional_contact_id uuid        references public.staffers(id) on delete set null,
  primary_team_id          uuid        references public.teams(id) on delete set null,
  notes                    text        check (char_length(notes) <= 255),
  location                 text,
  follow_up_date           date,
  champion_score           integer     check (champion_score between 0 and 5),
  links                    jsonb       not null default '[]'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid        not null references auth.users(id)
);

create trigger meetings_updated_at
  before update on public.meetings
  for each row execute function public.handle_updated_at();

create index idx_meetings_org_date on public.meetings (org_id, meeting_date desc);

grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.meetings to service_role;

alter table public.meetings enable row level security;

create policy "org members read own-org meetings"
  on public.meetings for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members insert own-org meetings"
  on public.meetings for insert to authenticated
  with check (
    (public.is_in_org(org_id) or public.is_super_admin())
    and created_by = auth.uid()
  );

create or replace function public.meetings_lock_created_by()
  returns trigger
  language plpgsql
as $$
begin
  new.created_by := old.created_by;
  return new;
end;
$$;

create trigger meetings_lock_created_by
  before update on public.meetings
  for each row execute function public.meetings_lock_created_by();

create policy "org members update own-org meetings"
  on public.meetings for update to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin())
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members delete own-org meetings"
  on public.meetings for delete to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());
