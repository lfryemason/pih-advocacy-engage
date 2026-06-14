-- When a user confirms their email (email_confirmed_at goes null -> not null),
-- clear the placeholder flag and apply the profile details the claimer staged
-- in user metadata via signUpOrClaim. Done in a trigger rather than app code
-- so every confirmation path (verifyOtp in /auth/confirm, dashboard, admin
-- API) flips it. Confirming the email is the security boundary for claiming a
-- placeholder account: the staged password AND profile details are inert
-- until the link delivered to the real inbox is clicked, so an attacker who
-- merely submits the signup form can neither log in nor deface the profile.

create or replace function public.handle_user_email_confirmed()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  declare
    meta_state    text := nullif(new.raw_user_meta_data->>'state', '');
    meta_district text
      := nullif(new.raw_user_meta_data->>'congressional_district', '');
  begin
    -- Merge, don't bulldoze: a signup-form field only overwrites the
    -- placeholder's value when the claimer actually provided one (fixes
    -- typo'd names / wrong pronouns), while blanks keep what the
    -- placeholder's creator entered (e.g. they never redefined state).
    update public.profiles
      set is_placeholder = false,
          first_name = coalesce(
            nullif(new.raw_user_meta_data->>'first_name', ''), first_name),
          last_name = coalesce(
            nullif(new.raw_user_meta_data->>'last_name', ''), last_name),
          pronouns = coalesce(
            nullif(new.raw_user_meta_data->>'pronouns', ''), pronouns),
          state = coalesce(meta_state, state),
          congressional_district = case
            -- claimer picked a district -> it wins
            when meta_district is not null then meta_district
            -- claimer changed state without picking a district -> the old
            -- district belongs to the old state; drop it
            when meta_state is not null and meta_state is distinct from state
              then null
            else congressional_district
          end
      where user_id = new.id and is_placeholder;
    return new;
  end;
  $$;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_user_email_confirmed();
