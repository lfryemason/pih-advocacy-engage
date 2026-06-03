"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetings } from "@/lib/meetings/queries";
import { MeetingRow } from "@/lib/meetings/types";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { EMPTY_MEETING_FILTERS } from "@/components/meetings/meetings-filters";

const PAGE_SIZE = 10;

type SectionState = { meetings: MeetingRow[]; count: number };

export function RepMeetings({
  representativeId,
}: {
  representativeId: string;
}) {
  const [upcoming, setUpcoming] = useState<SectionState>({
    meetings: [],
    count: 0,
  });
  const [past, setPast] = useState<SectionState>({ meetings: [], count: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState<"upcoming" | "past" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    const supabase = createClient();
    try {
      const [up, pastResult] = await Promise.all([
        fetchMeetings(supabase, {
          filters: EMPTY_MEETING_FILTERS,
          representativeId,
          section: "upcoming",
          offset: 0,
          limit: PAGE_SIZE,
        }),
        fetchMeetings(supabase, {
          filters: EMPTY_MEETING_FILTERS,
          representativeId,
          section: "past",
          offset: 0,
          limit: PAGE_SIZE,
        }),
      ]);
      setUpcoming(up);
      setPast(pastResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load meetings");
    } finally {
      setInitialLoading(false);
    }
  }, [representativeId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = async (section: "upcoming" | "past") => {
    setLoadingMore(section);
    const supabase = createClient();
    try {
      const offset =
        section === "upcoming"
          ? upcoming.meetings.length
          : past.meetings.length;
      const result = await fetchMeetings(supabase, {
        filters: EMPTY_MEETING_FILTERS,
        representativeId,
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load more meetings");
    } finally {
      setLoadingMore(null);
    }
  };

  if (initialLoading) {
    return (
      <p role="status" className="py-8 text-center text-muted-foreground">
        Loading meetings…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="py-8 text-center text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <MeetingsSection
        title="Future Meetings"
        meetings={upcoming.meetings}
        totalCount={upcoming.count}
        onShowMore={() => loadMore("upcoming")}
        disableLoadMore={loadingMore === "upcoming"}
        showRepColumn={false}
      />
      <MeetingsSection
        title="Past Meetings"
        meetings={past.meetings}
        totalCount={past.count}
        onShowMore={() => loadMore("past")}
        disableLoadMore={loadingMore === "past"}
        isPast
        showRepColumn={false}
      />
    </div>
  );
}
