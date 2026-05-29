import { describe, it, expect } from "vitest";
import { categorizeMeetings, applyMeetingFilters } from "@/lib/meetings/utils";
import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { EMPTY_MEETING_FILTERS } from "@/components/meetings/meetings-filters";

function makeRow(
  overrides: Partial<MeetingRow> & { meeting_date: string },
): MeetingRow {
  return {
    id: "id-1",
    meeting_time: null,
    representative_id: "rep-1",
    representative_bioguide_id: "R000001",
    representative_name: "Jane Rep",
    representative_state: "WA",
    representative_district: 9,
    representative_party: "Democrat",
    congressional_contact_id: null,
    congressional_contact_name: "Jane Rep",
    primary_team_id: null,
    primary_team_name: null,
    primary_team_slug: null,
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    ...overrides,
  };
}

const PAST = makeRow({ id: "past-1", meeting_date: "2020-01-01" });
const UPCOMING_1 = makeRow({ id: "upcoming-1", meeting_date: "2099-01-01" });
const UPCOMING_2 = makeRow({ id: "upcoming-2", meeting_date: "2099-06-01" });

describe("categorizeMeetings", () => {
  it("puts future dates in upcoming and past dates in past", () => {
    const { upcoming, past } = categorizeMeetings([PAST, UPCOMING_1]);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(1);
    expect(upcoming[0].id).toBe("upcoming-1");
    expect(past[0].id).toBe("past-1");
  });

  it("sorts upcoming ascending (soonest first)", () => {
    const { upcoming } = categorizeMeetings([UPCOMING_2, UPCOMING_1]);
    expect(upcoming.map((m) => m.id)).toEqual(["upcoming-1", "upcoming-2"]);
  });

  it("sorts past descending (most recent first)", () => {
    const older = makeRow({ id: "older", meeting_date: "2019-01-01" });
    const { past } = categorizeMeetings([older, PAST]);
    expect(past.map((m) => m.id)).toEqual(["past-1", "older"]);
  });

  it("returns empty arrays when meetings list is empty", () => {
    const { upcoming, past } = categorizeMeetings([]);
    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(0);
  });
});

describe("applyMeetingFilters", () => {
  const waRep = makeRow({
    id: "wa",
    meeting_date: "2099-01-01",
    representative_state: "WA",
    representative_district: 9,
    representative_party: "Democrat",
  });
  const orRep = makeRow({
    id: "or",
    meeting_date: "2099-01-01",
    representative_state: "OR",
    representative_district: 1,
    representative_party: "Republican",
  });

  it("returns all meetings when no filters are active", () => {
    expect(
      applyMeetingFilters([waRep, orRep], EMPTY_MEETING_FILTERS),
    ).toHaveLength(2);
  });

  it("filters by state", () => {
    const filters: MeetingFilters = {
      ...EMPTY_MEETING_FILTERS,
      states: ["WA"],
    };
    const result = applyMeetingFilters([waRep, orRep], filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wa");
  });

  it("filters by district", () => {
    const filters: MeetingFilters = {
      ...EMPTY_MEETING_FILTERS,
      districts: ["9"],
    };
    const result = applyMeetingFilters([waRep, orRep], filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wa");
  });

  it("filters by party", () => {
    const filters: MeetingFilters = {
      ...EMPTY_MEETING_FILTERS,
      parties: ["Republican"],
    };
    const result = applyMeetingFilters([waRep, orRep], filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("or");
  });

  it("combines multiple active filters (AND logic)", () => {
    const filters: MeetingFilters = {
      states: ["WA"],
      districts: ["1"],
      parties: [],
    };
    expect(applyMeetingFilters([waRep, orRep], filters)).toHaveLength(0);
  });

  it("returns empty array when no meetings match", () => {
    const filters: MeetingFilters = {
      ...EMPTY_MEETING_FILTERS,
      states: ["TX"],
    };
    expect(applyMeetingFilters([waRep, orRep], filters)).toHaveLength(0);
  });
});
