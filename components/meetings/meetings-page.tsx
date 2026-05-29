"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetings } from "@/lib/meetings/queries";
import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import {
  MeetingsFilters,
  EMPTY_MEETING_FILTERS,
} from "@/components/meetings/meetings-filters";

const PAGE_SIZE = 15;

type SectionState = {
  meetings: MeetingRow[];
  count: number;
};

export function MeetingsPage() {
  const [upcoming, setUpcoming] = useState<SectionState>({
    meetings: [],
    count: 0,
  });
  const [past, setPast] = useState<SectionState>({ meetings: [], count: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState<"upcoming" | "past" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingFilters>(EMPTY_MEETING_FILTERS);

  const loadInitial = useCallback(
    async (f: MeetingFilters, isFirst: boolean) => {
      if (isFirst) setInitialLoading(true);
      else setFiltering(true);
      setError(null);
      const supabase = createClient();
      try {
        const [up, past] = await Promise.all([
          fetchMeetings(supabase, {
            filters: f,
            section: "upcoming",
            offset: 0,
            limit: PAGE_SIZE,
          }),
          fetchMeetings(supabase, {
            filters: f,
            section: "past",
            offset: 0,
            limit: PAGE_SIZE,
          }),
        ]);
        setUpcoming(up);
        setPast(past);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load meetings");
      } finally {
        if (isFirst) setInitialLoading(false);
        else setFiltering(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadInitial(filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (f: MeetingFilters) => {
    setFilters(f);
    loadInitial(f, false);
  };

  const loadMore = async (section: "upcoming" | "past") => {
    setLoadingMore(section);
    const supabase = createClient();
    try {
      const offset =
        section === "upcoming"
          ? upcoming.meetings.length
          : past.meetings.length;
      const result = await fetchMeetings(supabase, {
        filters,
        section,
        offset,
        limit: PAGE_SIZE,
      });
      if (section === "upcoming") {
        setUpcoming((prev) => ({
          count: result.count,
          meetings: [...prev.meetings, ...result.meetings],
        }));
      } else {
        setPast((prev) => ({
          count: result.count,
          meetings: [...prev.meetings, ...result.meetings],
        }));
      }
    } catch {
      // user can retry by clicking again
    } finally {
      setLoadingMore(null);
    }
  };

  return (
    <div className="flex flex-col p-8">
      <h1 className="mb-6 text-3xl font-bold">Meetings</h1>
      <MeetingsFilters
        filters={filters}
        onChange={handleFiltersChange}
        disabled={filtering || initialLoading}
      />
      {initialLoading ? (
        <p role="status" className="py-8 text-center text-muted-foreground">
          Loading meetings…
        </p>
      ) : error ? (
        <p role="alert" className="py-8 text-center text-destructive">
          {error}
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          <MeetingsSection
            title="Upcoming Meetings"
            meetings={upcoming.meetings}
            totalCount={upcoming.count}
            onShowMore={() => loadMore("upcoming")}
            disableLoadMore={loadingMore === "upcoming" || filtering}
          />
          <MeetingsSection
            title="Past Meetings"
            meetings={past.meetings}
            totalCount={past.count}
            onShowMore={() => loadMore("past")}
            disableLoadMore={loadingMore === "past" || filtering}
            isPast
          />
        </div>
      )}
    </div>
  );
}
