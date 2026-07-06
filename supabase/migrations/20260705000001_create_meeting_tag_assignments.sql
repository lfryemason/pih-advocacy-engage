create table public.meeting_tag_assignments (
  meeting_id uuid        not null references public.meetings(id) on delete cascade,
  tag_id     uuid        not null references public.meeting_tags(id) on delete cascade,
  org_id     text        not null,
  created_at timestamptz not null default now(),
  primary key (meeting_id, tag_id)
);

create index idx_meeting_tag_assignments_tag on public.meeting_tag_assignments (tag_id);

grant select, insert, delete on public.meeting_tag_assignments to authenticated;
grant select, insert, update, delete on public.meeting_tag_assignments to service_role;

alter table public.meeting_tag_assignments enable row level security;

create policy "org members read own-org meeting tag assignments"
  on public.meeting_tag_assignments for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "org members insert own-org meeting tag assignments"
  on public.meeting_tag_assignments for insert to authenticated
  with check (
    (public.is_in_org(org_id) or public.is_super_admin())
    and exists (
      select 1 from public.meetings m
      where m.id = meeting_tag_assignments.meeting_id and m.org_id = meeting_tag_assignments.org_id
    )
    and exists (
      select 1 from public.meeting_tags mt
      where mt.id = meeting_tag_assignments.tag_id and mt.org_id = meeting_tag_assignments.org_id
    )
  );

create policy "org members delete own-org meeting tag assignments"
  on public.meeting_tag_assignments for delete to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());
