-- The previous migration adds location_json alongside the legacy `location`
-- column, but a one-time backfill only covers rows that already existed when
-- it ran. The app that reads/writes meetings deploys separately from this
-- migration, so there's a window where whichever app version is live only
-- knows about one of the two columns. Without something keeping them in
-- sync during that window, meetings touched in the gap would have a stale
-- (or missing) value in whichever column the live app doesn't write to,
-- and that data is gone once the app fully cuts over to location_json.
--
-- A trigger closes that gap regardless of deploy order: whichever column a
-- write actually changes, derive the other from it using the same rules as
-- the backfill. If a caller sets both in the same statement, location_json
-- wins, since that's the column every app version is expected to converge
-- on.

create or replace function public.meeting_location_text_to_json(loc text)
  returns jsonb
  language sql
  immutable
  set search_path = public, pg_temp
  as $$
    select case
      when loc is null or btrim(loc) = '' then null
      when lower(btrim(loc)) = 'virtual' then
        jsonb_build_object(
          'isVirtual', true,
          'city', '', 'state', '', 'building', '', 'room', ''
        )
      when btrim(loc) ~ '^\d+\s+\S' then
        jsonb_build_object(
          'isVirtual', false,
          'city', '', 'state', '',
          'building', btrim(regexp_replace(btrim(loc), '^\d+\s+', '')),
          'room', (regexp_match(btrim(loc), '^(\d+)\s+'))[1]
        )
      else
        jsonb_build_object(
          'isVirtual', false,
          'city', '', 'state', '',
          'building', btrim(loc),
          'room', ''
        )
    end;
  $$;

create or replace function public.meeting_location_json_to_text(loc jsonb)
  returns text
  language sql
  immutable
  set search_path = public, pg_temp
  as $$
    select case
      when loc is null then null
      when (loc ->> 'isVirtual')::boolean is true then 'Virtual'
      when btrim(coalesce(loc ->> 'building', '')) <> ''
        and btrim(coalesce(loc ->> 'room', '')) <> ''
        then btrim(loc ->> 'room') || ' ' || btrim(loc ->> 'building')
      when btrim(coalesce(loc ->> 'building', '')) <> ''
        then btrim(loc ->> 'building')
      when btrim(coalesce(loc ->> 'room', '')) <> ''
        then btrim(loc ->> 'room')
      else null
    end;
  $$;

create or replace function public.sync_meeting_location_columns()
  returns trigger
  language plpgsql
  set search_path = public, pg_temp
  as $$
  begin
    if tg_op = 'INSERT' then
      if new.location_json is not null then
        new.location := public.meeting_location_json_to_text(new.location_json);
      elsif new.location is not null then
        new.location_json := public.meeting_location_text_to_json(new.location);
      end if;
    elsif new.location_json is distinct from old.location_json then
      new.location := public.meeting_location_json_to_text(new.location_json);
    elsif new.location is distinct from old.location then
      new.location_json := public.meeting_location_text_to_json(new.location);
    end if;
    return new;
  end;
  $$;

create trigger meetings_sync_location_columns
  before insert or update on public.meetings
  for each row
  execute function public.sync_meeting_location_columns();
