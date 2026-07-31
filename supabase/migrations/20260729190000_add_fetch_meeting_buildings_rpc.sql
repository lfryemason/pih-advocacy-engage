-- fetchMeetingBuildings used to pull every org meeting's location_json to the
-- client and dedup/sort building names in JS. Move that work into Postgres:
-- an expression index backs a DISTINCT ON query, and RLS (security invoker,
-- the default) keeps this scoped the same way the underlying table already is.

create index idx_meetings_org_building
  on public.meetings (org_id, lower(btrim(location_json ->> 'building')))
  where btrim(coalesce(location_json ->> 'building', '')) <> '';

create or replace function public.fetch_meeting_buildings(p_org_id text)
  returns table (building text)
  language sql
  stable
  set search_path = public, pg_temp
  as $$
    select distinct on (lower(btrim(m.location_json ->> 'building')))
      btrim(m.location_json ->> 'building') as building
    from public.meetings m
    where m.org_id = p_org_id
      and btrim(coalesce(m.location_json ->> 'building', '')) <> ''
    order by lower(btrim(m.location_json ->> 'building')), building;
  $$;

revoke execute on function public.fetch_meeting_buildings(text) from public;
grant execute on function public.fetch_meeting_buildings(text) to authenticated;
