-- Create the representatives table for storing members of Congress
create table public.representatives (
  id uuid primary key default gen_random_uuid(),
  bioguide_id text unique not null,
  first_name text not null,
  last_name text not null,
  official_full_name text,
  chamber text not null check (chamber in ('sen', 'rep')),
  state text not null,
  district integer,
  party text not null,
  state_rank text check (state_rank in ('junior', 'senior')),

  -- Reps must have a district and no state_rank; senators vice versa
  constraint chk_rep_fields check (
    (chamber = 'rep' and district is not null and state_rank is null) or
    (chamber = 'sen' and district is null and state_rank is not null)
  ),
  birthday date,
  in_office boolean not null default true,
  general_links jsonb not null default '[]'::jsonb,
  org_links jsonb not null default '{"pihe": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for user lookup patterns
create index idx_representatives_state on public.representatives (state);
create index idx_representatives_state_district on public.representatives (state, district);

-- Auto-update updated_at on row modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger representatives_updated_at
  before update on public.representatives
  for each row
  execute function public.handle_updated_at();

-- Enable RLS: authenticated users can read, no write policies
alter table public.representatives enable row level security;

create policy "Authenticated users can read representatives"
  on public.representatives
  for select
  to authenticated
  using (true);
