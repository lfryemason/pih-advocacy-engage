-- Additive step toward structured meeting locations.
-- Adds a jsonb `location_json` column alongside the existing free-text `location`
-- and backfills it from the current text values. The old `location` column is left
-- in place so already-deployed code keeps working; a later migration drops it once
-- every reader/writer has moved to `location_json`.
--
-- Backfill of existing free-text values:
--   * null/blank        -> null
--   * "Virtual"         -> { isVirtual: true, ... }
--   * "<digits> <rest>" -> room = digits, building = rest (e.g. "509 Hart ...")
--   * anything else     -> building = whole string

alter table public.meetings
  add column location_json jsonb;

update public.meetings
set location_json = case
  when location is null or btrim(location) = '' then null
  when lower(btrim(location)) = 'virtual' then
    jsonb_build_object(
      'isVirtual', true,
      'city', '', 'state', '', 'building', '', 'room', ''
    )
  when btrim(location) ~ '^\d+\s+\S' then
    jsonb_build_object(
      'isVirtual', false,
      'city', '', 'state', '',
      'building', btrim(regexp_replace(btrim(location), '^\d+\s+', '')),
      'room', (regexp_match(btrim(location), '^(\d+)\s+'))[1]
    )
  else
    jsonb_build_object(
      'isVirtual', false,
      'city', '', 'state', '',
      'building', btrim(location),
      'room', ''
    )
end;

-- Reject misshapen blobs: location_json must be null, or an object carrying
-- exactly the expected keys with the expected scalar types. coalesce guards the
-- missing-key case (a CHECK passes on NULL, so an absent key would otherwise slip
-- through).
alter table public.meetings
  add constraint meetings_location_json_shape check (
    location_json is null or (
      jsonb_typeof(location_json) = 'object'
      and coalesce(jsonb_typeof(location_json -> 'isVirtual'), '') = 'boolean'
      and coalesce(jsonb_typeof(location_json -> 'city'), '')      = 'string'
      and coalesce(jsonb_typeof(location_json -> 'state'), '')     = 'string'
      and coalesce(jsonb_typeof(location_json -> 'building'), '')  = 'string'
      and coalesce(jsonb_typeof(location_json -> 'room'), '')      = 'string'
      -- no keys beyond the five above: strip them and require nothing is left
      and location_json - array['isVirtual', 'city', 'state', 'building', 'room'] = '{}'::jsonb
    )
  );
