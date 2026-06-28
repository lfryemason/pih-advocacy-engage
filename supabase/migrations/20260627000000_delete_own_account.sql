-- Self-serve account deletion.
--
-- Deleting a user from auth.users cascades to profiles, user_role,
-- team_memberships, and meeting_delegation_members (all on delete cascade).
-- meetings.created_by is the exception: it references auth.users with no
-- on-delete action, so a user who logged any meeting could not be deleted.
-- We preserve those meeting records and just null out the authorship link.

-- created_by becomes nullable so it can be cleared when the author is deleted.
alter table public.meetings
  alter column created_by drop not null;

-- created_by stays immutable for everyone, EXCEPT when delete_own_account()
-- clears it during account deletion. That path sets a transaction-local GUC
-- (app.account_deletion) that only the security-definer function below can
-- set, so this is not a new write path for regular users.
create or replace function public.meetings_lock_created_by()
  returns trigger
  language plpgsql
as $$
begin
  if coalesce(current_setting('app.account_deletion', true), '') <> 'on' then
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

-- Permanently delete the calling user's own account.
-- SECURITY DEFINER so it can reach auth.users; scoped strictly to auth.uid().
create or replace function public.delete_own_account()
  returns void
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Let the lock trigger accept the null-out below for this transaction only.
  perform set_config('app.account_deletion', 'on', true);

  -- Keep the meeting records, drop the personal authorship link.
  update public.meetings set created_by = null where created_by = v_uid;

  -- Cascades to profiles, user_role, team_memberships, and
  -- meeting_delegation_members, plus the auth schema's own sessions,
  -- identities, and refresh tokens.
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
