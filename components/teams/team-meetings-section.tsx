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
};
const LIMIT = 50;

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MeetingsTable({
  title,
  meetings,
  isPast = false,
}: {
  title: string;
  meetings: MeetingRow[];
  isPast?: boolean;
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const [open, setOpen] = useState(true);

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
              <TableHeader className="[&_tr]:bg-orange-400 [&_tr]:hover:bg-orange-400">
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">View in meetings</span>
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Member of Congress</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Scheduling Lead</TableHead>
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
          </div>
        ))}
    </section>
  );
}

export function TeamMeetingsSection({ teamId }: { teamId: string }) {
  const [upcoming, setUpcoming] = useState<MeetingRow[]>([]);
  const [past, setPast] = useState<MeetingRow[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      fetchMeetings(supabase, {
        filters: EMPTY_FILTERS,
        section: "upcoming",
        offset: 0,
        limit: LIMIT,
        teamId,
      }),
      fetchMeetings(supabase, {
        filters: EMPTY_FILTERS,
        section: "past",
        offset: 0,
        limit: LIMIT,
        teamId,
      }),
    ])
      .then(([upcomingResult, pastResult]) => {
        if (!active) return;
        setUpcoming(upcomingResult.meetings);
        setPast(pastResult.meetings);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [teamId]);

  return (
    <>
      <MeetingsTable title="Future Meetings" meetings={upcoming} />
      <MeetingsTable title="Past Meetings" meetings={past} isPast />
    </>
  );
}
