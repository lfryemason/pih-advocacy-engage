"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetings, fetchMyTeams } from "@/lib/meetings/queries";
import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { MeetingsFilters } from "@/components/meetings/meetings-filters";
import { AddMeetingDialog } from "@/components/meetings/create/add-meeting-dialog";
import { PersonalMeetingsSection } from "@/components/meetings/personal-meetings-section";
import { CollapsibleMeetingsGroup } from "@/components/meetings/collapsible-meetings-group";

const PAGE_SIZE = 15;

type SectionState = {
  meetings: MeetingRow[];
  count: number;
};

function filtersFromParams(params: URLSearchParams): MeetingFilters {
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const virtual = params.get("virtual");
  return {
    states: params.getAll("state"),
    districts: params.getAll("district"),
    parties: params.getAll("party"),
    representativeIds: params.getAll("rep"),
    dateRange: { from: dateFrom, to: dateTo },
    buildings: params.getAll("building"),
    isVirtual: virtual === "1" ? true : virtual === "0" ? false : null,
  };
}

function filtersToSearch(f: MeetingFilters): string {
  const params = new URLSearchParams();
  f.states.forEach((state) => params.append("state", state));
  f.districts.forEach((district) => params.append("district", district));
  f.parties.forEach((party) => params.append("party", party));
  f.representativeIds.forEach((id) => params.append("rep", id));
  if (f.dateRange.from) params.set("dateFrom", f.dateRange.from);
  if (f.dateRange.to) params.set("dateTo", f.dateRange.to);
  f.buildings.forEach((b) => params.append("building", b));
  if (f.isVirtual !== null) params.set("virtual", f.isVirtual ? "1" : "0");
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function MeetingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [upcoming, setUpcoming] = useState<SectionState>({
    meetings: [],
    count: 0,
  });
  const [past, setPast] = useState<SectionState>({ meetings: [], count: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState<"upcoming" | "past" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingFilters>(() =>
    filtersFromParams(searchParams),
  );
  const [myTeams, setMyTeams] = useState<
    { team_id: string; team_name: string }[]
  >([]);
  const [personalRefreshKey, setPersonalRefreshKey] = useState(0);

  // Always reflects the latest committed filters so loadMore doesn't close over stale values
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    const supabase = createClient();
    fetchMyTeams(supabase)
      .then(setMyTeams)
      .catch(() => {});
  }, []);

  // Incremented on every loadInitial call; stale responses are discarded
  const fetchGenRef = useRef(0);

  const loadInitial = useCallback(async (f: MeetingFilters) => {
    const gen = ++fetchGenRef.current;
    setFiltering(true);
    setError(null);
    const supabase = createClient();
    try {
      const [up, pastResult] = await Promise.all([
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
      if (gen !== fetchGenRef.current) return;
      setUpcoming(up);
      setPast(pastResult);
    } catch (e: unknown) {
      if (gen !== fetchGenRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load meetings");
    } finally {
      if (gen === fetchGenRef.current) {
        setFiltering(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const f = filtersFromParams(searchParams);
    setFilters(f);
    setApplyingFilters(true);
    loadInitial(f).finally(() => setApplyingFilters(false));
  }, [searchParams, loadInitial]);

  const refreshAll = useCallback(() => {
    loadInitial(filtersRef.current);
    setPersonalRefreshKey((key) => key + 1);
  }, [loadInitial]);

  const handleFiltersChange = (f: MeetingFilters) => {
    router.replace(pathname + filtersToSearch(f), { scroll: false });
  };

  const loadMore = async (section: "upcoming" | "past") => {
    setLoadingMore(section);
    setLoadMoreError(null);
    const supabase = createClient();
    try {
      const offset =
        section === "upcoming"
          ? upcoming.meetings.length
          : past.meetings.length;
      const result = await fetchMeetings(supabase, {
        filters: filtersRef.current,
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
      setLoadMoreError(
        e instanceof Error ? e.message : "Failed to load more meetings",
      );
    } finally {
      setLoadingMore(null);
    }
  };

  return (
    <div className="flex flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <AddMeetingDialog onCreated={refreshAll} />
      </div>
      <MeetingsFilters
        filters={filters}
        onChange={handleFiltersChange}
        disabled={filtering || initialLoading}
      />
      <div className="flex flex-col gap-6">
        <CollapsibleMeetingsGroup title="My Meetings" defaultOpen>
          <PersonalMeetingsSection
            mode="user"
            filters={filters}
            variant="pink"
            refreshKey={personalRefreshKey}
          />
        </CollapsibleMeetingsGroup>
        {myTeams.length > 0 && (
          <CollapsibleMeetingsGroup title="Team Meetings" defaultOpen={false}>
            {myTeams.map((team) => (
              <div key={team.team_id}>
                <h3 className="text-xl font-semibold">
                  {`${team.team_name} Meetings`}
                </h3>
                <div className="ml-8 mt-3">
                  <PersonalMeetingsSection
                    mode="team"
                    teamId={team.team_id}
                    filters={filters}
                    variant="teal"
                    refreshKey={personalRefreshKey}
                  />
                </div>
              </div>
            ))}
          </CollapsibleMeetingsGroup>
        )}
        <CollapsibleMeetingsGroup title="All Meetings" defaultOpen={false}>
          {initialLoading ? (
            <p role="status" className="py-8 text-center text-muted-foreground">
              Loading meetings…
            </p>
          ) : error ? (
            <p role="alert" className="py-8 text-center text-destructive">
              {error}
            </p>
          ) : (
            <div
              className="flex flex-col gap-10"
              {...(applyingFilters
                ? { role: "status", "aria-label": "Updating meetings" }
                : {})}
            >
              <MeetingsSection
                title="Upcoming Meetings"
                meetings={upcoming.meetings}
                totalCount={upcoming.count}
                onShowMore={() => loadMore("upcoming")}
                disableLoadMore={loadingMore === "upcoming" || filtering}
                onRefresh={refreshAll}
                loading={applyingFilters}
              />
              <MeetingsSection
                title="Past Meetings"
                meetings={past.meetings}
                totalCount={past.count}
                onShowMore={() => loadMore("past")}
                disableLoadMore={loadingMore === "past" || filtering}
                onRefresh={refreshAll}
                isPast
                loading={applyingFilters}
              />
              {loadMoreError && (
                <p
                  role="alert"
                  className="text-center text-sm text-destructive"
                >
                  {loadMoreError}
                </p>
              )}
            </div>
          )}
        </CollapsibleMeetingsGroup>
      </div>
    </div>
  );
}
