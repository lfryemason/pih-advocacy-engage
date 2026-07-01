"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import {
  MeetingsSection,
  type MeetingsSectionVariant,
} from "@/components/meetings/meetings-section";
import {
  fetchMyMeetings,
  fetchTeamDelegationMeetings,
  type PersonalFetchParams,
} from "@/lib/meetings/queries";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

const UPCOMING_LIMIT = 50;
const PAGE_SIZE = 15;

type SectionState = { meetings: MeetingRow[]; count: number };

type Props =
  | {
      title: string;
      mode: "user";
      filters: MeetingFilters;
      variant?: MeetingsSectionVariant;
    }
  | {
      mode: "team";
      teamId: string;
      filters: MeetingFilters;
      variant?: MeetingsSectionVariant;
    };

export function PersonalMeetingsSection(props: Props) {
  const { mode, filters, variant = "default" } = props;
  const teamId = mode === "team" ? props.teamId : undefined;

  const [upcoming, setUpcoming] = useState<SectionState>({
    meetings: [],
    count: 0,
  });
  const [past, setPast] = useState<SectionState>({ meetings: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMoreUpcoming, setLoadingMoreUpcoming] = useState(false);
  const [loadingMorePast, setLoadingMorePast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGenRef = useRef(0);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchSection = useCallback(
    (supabase: SupabaseBrowserClient, params: PersonalFetchParams) => {
      if (mode === "user") {
        return fetchMyMeetings(supabase, params);
      }
      return fetchTeamDelegationMeetings(supabase, {
        teamId: teamId!,
        ...params,
      });
    },
    [mode, teamId],
  );

  const loadInitial = useCallback(
    async (currentFilters: MeetingFilters) => {
      const generation = ++fetchGenRef.current;
      setLoading(true);
      setError(null);
      const supabase = createClient();
      try {
        const [upResult, pastResult] = await Promise.all([
          fetchSection(supabase, {
            filters: currentFilters,
            section: "upcoming",
            offset: 0,
            limit: UPCOMING_LIMIT,
          }),
          fetchSection(supabase, {
            filters: currentFilters,
            section: "past",
            offset: 0,
            limit: PAGE_SIZE,
          }),
        ]);
        if (generation !== fetchGenRef.current) return;
        setUpcoming(upResult);
        setPast(pastResult);
      } catch (err) {
        if (generation !== fetchGenRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load meetings",
        );
      } finally {
        if (generation === fetchGenRef.current) setLoading(false);
      }
    },
    [fetchSection],
  );

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    loadInitial(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, loadInitial]);

  const loadMore = async (section: "upcoming" | "past") => {
    const setLoadingMore =
      section === "upcoming" ? setLoadingMoreUpcoming : setLoadingMorePast;
    setLoadingMore(true);
    const supabase = createClient();
    try {
      const result = await fetchSection(supabase, {
        filters: filtersRef.current,
        section,
        offset:
          section === "upcoming"
            ? upcoming.meetings.length
            : past.meetings.length,
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more meetings",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadInitial(filtersRef.current);
  }, [loadInitial]);

  if (loading) {
    return (
      <p role="status" className="py-8 text-center text-muted-foreground">
        Loading…
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
    <div className="flex flex-col gap-6">
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={upcoming.meetings}
        totalCount={upcoming.count}
        onShowMore={() => loadMore("upcoming")}
        disableLoadMore={loadingMoreUpcoming}
        onRefresh={handleRefresh}
        variant={variant}
        compact={!!teamId}
      />
      <MeetingsSection
        title="Past Meetings"
        meetings={past.meetings}
        totalCount={past.count}
        onShowMore={() => loadMore("past")}
        disableLoadMore={loadingMorePast}
        onRefresh={handleRefresh}
        isPast
        variant={variant}
        compact={!!teamId}
      />
    </div>
  );
}
