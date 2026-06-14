-- Placeholder teammates: a login-less auth user created via the admin API so a
-- person can be put on team rosters / meeting delegations before they sign up.
-- profiles.is_placeholder drives UI (Pending badge) and server-action gating;
-- the security boundary for claiming the account is email verification, not
-- this flag.

alter table public.profiles
  add column is_placeholder boolean not null default false;

-- Re-create handle_new_user so the trigger (the row's sole creator) also
-- writes is_placeholder from user metadata. coalesce(..., false) keeps normal
-- signups false — the metadata key is simply absent for them.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  declare
    new_org_id text;
  begin
    insert into public.user_role (user_id, role, org_id)
      values (new.id, 'member', 'pihe')
      on conflict (user_id) do nothing
      returning org_id into new_org_id;

    -- on conflict the returning clause yields no row; look it up instead
    if new_org_id is null then
      select org_id into new_org_id
        from public.user_role where user_id = new.id;
    end if;

    -- only create a profile if we have an org (super_admins have null org_id
    -- and are excluded here intentionally)
    if new_org_id is not null then
      insert into public.profiles (
        user_id, org_id, email,
        first_name, last_name, pronouns, state, congressional_district,
        is_placeholder
      )
      values (
        new.id,
        new_org_id,
        new.email,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'pronouns',
        new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'congressional_district',
        coalesce((new.raw_user_meta_data->>'is_placeholder')::boolean, false)
      )
      on conflict (user_id) do nothing;
    end if;

    return new;
  end;
  $$;
