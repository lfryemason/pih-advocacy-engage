-- Staffers belonging to a representative, scoped per org. A rep can have many
-- staffers per org, so the PK is a uuid (not the (rep, org) composite used by
-- representative_org_info). No unique constraint on email — the same person
-- may staff multiple reps, and duplicates within one rep are allowed.
create table public.staffers (
  id uuid primary key default gen_random_uuid(),
  representative_id uuid not null references public.representatives(id) on delete cascade,
  org_id text not null,
  first_name text not null,
  last_name text not null,
  title text,
  pronouns text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_staffers_rep_org on public.staffers (representative_id, org_id);

create trigger staffers_updated_at
  before update on public.staffers
  for each row execute function public.handle_updated_at();

alter table public.staffers enable row level security;

-- Members of the org can read/insert/update their own-org staffers (staffer
-- maintenance is collaborative, not admin-gated). Delete stays restricted to
-- org_admin/super_admin since it's destructive. is_in_org / is_org_admin_for
-- both scope by org_id so org A's users can't touch org B's rows.
create policy "members read own-org staffers"
  on public.staffers
  for select
  to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "members insert own-org staffers"
  on public.staffers
  for insert
  to authenticated
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "members update own-org staffers"
  on public.staffers
  for update
  to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin())
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "org admins delete own-org staffers"
  on public.staffers
  for delete
  to authenticated
  using (public.is_org_admin_for(org_id) or public.is_super_admin());
