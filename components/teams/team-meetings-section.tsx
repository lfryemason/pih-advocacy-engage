"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetings } from "@/lib/meetings/queries";
import { MeetingRow, MeetingFilters } from "@/lib/meetings/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EMPTY_FILTERS: MeetingFilters = {
  states: [],
  districts: [],
  parties: [],
  representativeIds: [],
  dateRange: { from: null, to: null },
};
const PAGE_SIZE = 10;

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MeetingsTable({
  title,
  teamId,
  section,
}: {
  title: string;
  teamId: string;
  section: "upcoming" | "past";
}) {
  const isPast = section === "past";
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const [open, setOpen] = useState(true);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    setLoading(true);
    fetchMeetings(supabase, {
      filters: EMPTY_FILTERS,
      section,
      offset: 0,
      limit: PAGE_SIZE,
      teamId,
    })
      .then((result) => {
        if (!active) return;
        setMeetings(result.meetings);
        setTotal(result.count);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [teamId, section]);

  const loadMore = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const result = await fetchMeetings(supabase, {
        filters: EMPTY_FILTERS,
        section,
        offset: meetings.length,
        limit: PAGE_SIZE,
        teamId,
      });
      setMeetings((prev) => [...prev, ...result.meetings]);
      setTotal(result.count);
    } catch {
      // ignore; keep the meetings already loaded
    } finally {
      setLoading(false);
    }
  };

  const hasMore = meetings.length < total;

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-lg font-semibold"
      >
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
        <span id={headingId}>{title}</span>
      </button>
      {open &&
        (meetings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No {isPast ? "past" : "upcoming"} meetings.
          </p>
        ) : (
          <div className="mt-2">
            <Table aria-label={title}>
              <TableHeader className="[&_tr]:bg-primary [&_tr]:hover:bg-primary">
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">View in meetings</span>
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Member of Congress</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Scheduler/Follow-up</TableHead>
                  {isPast && (
                    <TableHead className="text-center">
                      Follow-up Email
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <Link
                        href="/meetings"
                        aria-label={`View meeting with ${meeting.representative_name} in meetings`}
                        className="inline-flex text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUpLeft size={16} aria-hidden="true" />
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(meeting.meeting_date)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <Link
                        href={`/representatives/${meeting.representative_bioguide_id}`}
                        className="block truncate text-primary-dark underline-offset-4 hover:underline"
                      >
                        {meeting.representative_district === null
                          ? "Sen. "
                          : "Rep. "}
                        {meeting.representative_name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-0 truncate">
                      {meeting.congressional_contact_id === null ? (
                        <em>
                          {meeting.representative_district === null
                            ? "Senator"
                            : "Congressperson"}
                        </em>
                      ) : (
                        meeting.congressional_contact_name
                      )}
                    </TableCell>
                    <TableCell className="max-w-0 truncate">
                      {meeting.scheduling_lead_name ?? "—"}
                    </TableCell>
                    {isPast && (
                      <TableCell className="text-center">
                        {meeting.follow_up_date ? (
                          <CircleCheckBig
                            aria-label="Follow-up sent"
                            className="m-auto h-4 w-4 text-green-600"
                          />
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Show more"}
                </Button>
              </div>
            )}
          </div>
        ))}
    </section>
  );
}

export function TeamMeetingsSection({ teamId }: { teamId: string }) {
  return (
    <>
      <MeetingsTable
        title="Future Meetings"
        teamId={teamId}
        section="upcoming"
      />
      <MeetingsTable title="Past Meetings" teamId={teamId} section="past" />
    </>
  );
}
