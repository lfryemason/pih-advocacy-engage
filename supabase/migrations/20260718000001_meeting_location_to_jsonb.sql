-- Convert meetings.location from free text to a structured jsonb value:
--   { isVirtual: boolean, city: text, state: text, building: text, room: text }
-- Best-effort backfill of existing free-text values:
--   * null/blank        -> null
--   * "Virtual"         -> { isVirtual: true, ... }
--   * "<digits> <rest>" -> room = digits, building = rest (e.g. "509 Hart ...")
--   * anything else     -> building = whole string

alter table public.meetings
  alter column location type jsonb
  using (
    case
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
    end
  );
