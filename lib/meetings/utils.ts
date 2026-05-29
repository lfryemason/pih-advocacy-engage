import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { hasActiveMeetingFilters } from "@/components/meetings/meetings-filters";

export function categorizeMeetings(meetings: MeetingRow[]): {
  upcoming: MeetingRow[];
  past: MeetingRow[];
} {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = meetings
    .filter((m) => m.meeting_date >= today)
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
  const past = meetings
    .filter((m) => m.meeting_date < today)
    .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
  return { upcoming, past };
}

export function applyMeetingFilters(
  meetings: MeetingRow[],
  filters: MeetingFilters,
): MeetingRow[] {
  if (!hasActiveMeetingFilters(filters)) return meetings;
  return meetings.filter((m) => {
    if (
      filters.states.length > 0 &&
      !filters.states.includes(m.representative_state)
    )
      return false;
    if (
      filters.districts.length > 0 &&
      !filters.districts.includes(String(m.representative_district ?? ""))
    )
      return false;
    if (
      filters.parties.length > 0 &&
      !filters.parties.includes(m.representative_party)
    )
      return false;
    return true;
  });
}
