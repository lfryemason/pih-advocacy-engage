create type public.delegation_role as enum (
  'scheduling_lead',
  'attendee_talking',
  'attendee_listening',
  'pih_team_member',
  'note_taker'
);

create table public.meeting_delegation_members (
  id                 uuid                   primary key default gen_random_uuid(),
  meeting_id         uuid                   not null references public.meetings(id) on delete cascade,
  org_id             text                   not null,
  user_id            uuid                   not null references public.profiles(user_id) on delete cascade,
  role               public.delegation_role not null,
  team_id            uuid                   references public.teams(id) on delete set null,
  team_name_snapshot text,
  created_at         timestamptz            not null default now(),
  unique (meeting_id, user_id)
);

create index idx_meeting_delegation_members_meeting on public.meeting_delegation_members (meeting_id);
create index idx_meeting_delegation_members_user    on public.meeting_delegation_members (user_id);

grant select, insert, update, delete on public.meeting_delegation_members to authenticated;
grant select, insert, update, delete on public.meeting_delegation_members to service_role;

alter table public.meeting_delegation_members enable row level security;

create policy "org members read own-org delegation members"
  on public.meeting_delegation_members for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members insert own-org delegation members"
  on public.meeting_delegation_members for insert to authenticated
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members update own-org delegation members"
  on public.meeting_delegation_members for update to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin())
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members delete own-org delegation members"
  on public.meeting_delegation_members for delete to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());
