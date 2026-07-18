create table public.meeting_tags (
  id           uuid        primary key default gen_random_uuid(),
  org_id       text        not null,
  display_name text        not null,
  color        text        not null,
  icon_name    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_meeting_tags_org on public.meeting_tags (org_id);

create trigger meeting_tags_updated_at
  before update on public.meeting_tags
  for each row execute function public.handle_updated_at();

grant select, insert, update, delete on public.meeting_tags to authenticated;
grant select, insert, update, delete on public.meeting_tags to service_role;

alter table public.meeting_tags enable row level security;

create policy "members read own-org meeting_tags"
  on public.meeting_tags
  for select
  to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "org admins insert own-org meeting_tags"
  on public.meeting_tags
  for insert
  to authenticated
  with check (public.is_org_admin_for(org_id) or public.is_super_admin());

create policy "org admins update own-org meeting_tags"
  on public.meeting_tags
  for update
  to authenticated
  using (public.is_org_admin_for(org_id) or public.is_super_admin())
  with check (public.is_org_admin_for(org_id) or public.is_super_admin());

create policy "org admins delete own-org meeting_tags"
  on public.meeting_tags
  for delete
  to authenticated
  using (public.is_org_admin_for(org_id) or public.is_super_admin());
