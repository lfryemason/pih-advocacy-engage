"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetings } from "@/lib/meetings/queries";
import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import {
  MeetingsFilters,
  EMPTY_MEETING_FILTERS,
  hasActiveMeetingFilters,
} from "@/components/meetings/meetings-filters";

export function categorizeMeetings(meetings: MeetingRow[]): {
  upcoming: MeetingRow[];
  past: MeetingRow[];
} {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingFilters>(EMPTY_MEETING_FILTERS);

  useEffect(() => {
    const supabase = createClient();
    fetchMeetings(supabase)
      .then(setMeetings)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load meetings"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = applyMeetingFilters(meetings, filters);
  const { upcoming, past } = categorizeMeetings(filtered);

  return (
    <div className="flex flex-col p-8">
      <h1 className="mb-6 text-3xl font-bold">Meetings</h1>
      <MeetingsFilters filters={filters} onChange={setFilters} />
      {loading ? (
        <p role="status" className="py-8 text-center text-muted-foreground">
          Loading meetings…
        </p>
      ) : error ? (
        <p role="alert" className="py-8 text-center text-destructive">
          {error}
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          <MeetingsSection title="Upcoming Meetings" meetings={upcoming} />
          <MeetingsSection title="Past Meetings" meetings={past} />
        </div>
      )}
    </div>
  );
}
