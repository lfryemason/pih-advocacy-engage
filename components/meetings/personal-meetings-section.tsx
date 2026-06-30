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
      compact?: boolean;
    }
  | {
      title: string;
      mode: "team";
      teamId: string;
      filters: MeetingFilters;
      variant?: MeetingsSectionVariant;
      compact?: boolean;
    };

export function PersonalMeetingsSection(props: Props) {
  const { title, mode, filters, variant = "default", compact = false } = props;
  const teamId = mode === "team" ? props.teamId : undefined;

  const [upcoming, setUpcoming] = useState<SectionState>({
    meetings: [],
    count: 0,
  });
  const [past, setPast] = useState<SectionState>({ meetings: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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

  const loadMore = async () => {
    setLoadingMore(true);
    const supabase = createClient();
    try {
      if (upcoming.meetings.length < upcoming.count) {
        const result = await fetchSection(supabase, {
          filters: filtersRef.current,
          section: "upcoming",
          offset: upcoming.meetings.length,
          limit: PAGE_SIZE,
        });
        setUpcoming((prev) => ({
          count: result.count,
          meetings: [...prev.meetings, ...result.meetings],
        }));
      } else if (past.meetings.length < past.count) {
        const result = await fetchSection(supabase, {
          filters: filtersRef.current,
          section: "past",
          offset: past.meetings.length,
          limit: PAGE_SIZE,
        });
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

  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const allMeetings = [...upcoming.meetings, ...past.meetings];
  const totalCount = upcoming.count + past.count;
  const headingClass = compact ? "text-xl font-semibold" : "text-2xl font-bold";

  if (loading) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className={`mb-3 ${headingClass}`}>
          {title}
        </h2>
        <p role="status" className="py-8 text-center text-muted-foreground">
          Loading…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className={`mb-3 ${headingClass}`}>
          {title}
        </h2>
        <p role="alert" className="py-8 text-center text-destructive">
          {error}
        </p>
      </section>
    );
  }

  return (
    <MeetingsSection
      title={title}
      meetings={allMeetings}
      totalCount={totalCount}
      onShowMore={loadMore}
      disableLoadMore={loadingMore}
      isPast
      upcomingCount={upcoming.meetings.length}
      onRefresh={handleRefresh}
      variant={variant}
      compact={compact}
    />
  );
}
