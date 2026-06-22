"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { formatDate, formatTime, LINK_CN } from "@/lib/meetings/format";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { Pronouns } from "@/components/pronouns";

// Below the `md` breakpoint the table columns collapse, so surface the
// at-a-glance details (date/time/location) inline beneath the primary cell
// instead of forcing the row open. `includeDate` is false when the date is
// already shown in its own cell (rep detail view, where there is no rep cell).
function MeetingMetaMobile({
  meeting,
  includeDate,
}: {
  meeting: MeetingRowType;
  includeDate: boolean;
}) {
  const time = meeting.meeting_time
    ? formatTime(
        meeting.meeting_date,
        meeting.meeting_time,
        meeting.meeting_timezone,
      )
    : null;
  const primary = [includeDate ? formatDate(meeting.meeting_date) : null, time]
    .filter(Boolean)
    .join(" · ");

  if (!primary && !meeting.location) return null;

  return (
    <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground md:hidden">
      {primary && <span>{primary}</span>}
      {meeting.location && (
        <span className="flex min-w-0 items-center gap-1">
          <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">{meeting.location}</span>
        </span>
      )}
    </div>
  );
}

export function MeetingRow({
  meeting,
  isPast = false,
  showRepColumn = true,
  onRefresh = () => {},
}: {
  meeting: MeetingRowType;
  isPast?: boolean;
  showRepColumn?: boolean;
  onRefresh?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colSpan = (isPast ? 8 : 7) - (showRepColumn ? 0 : 1);
  const detailRowId = `meeting-detail-${meeting.id}`;

  const toggle = () => setIsExpanded((v) => !v);

  return (
    <>
      <TableRow
        className={`cursor-pointer hover:bg-accent ${isExpanded ? "bg-accent" : ""}`}
        onClick={toggle}
      >
        <TableCell className="align-top md:align-middle">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Expand meeting with ${meeting.representative_name}`}
            aria-expanded={isExpanded}
            aria-controls={detailRowId}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className={`h-4 w-4`} />
            ) : (
              <ChevronRight aria-hidden="true" className={`h-4 w-4`} />
            )}
          </Button>
        </TableCell>
        <TableCell
          className={
            showRepColumn ? "hidden md:table-cell" : "align-top md:align-middle"
          }
        >
          {formatDate(meeting.meeting_date)}
          {!showRepColumn && (
            <MeetingMetaMobile meeting={meeting} includeDate={false} />
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {meeting.meeting_time
            ? formatTime(
                meeting.meeting_date,
                meeting.meeting_time,
                meeting.meeting_timezone,
              )
            : "—"}
        </TableCell>
        <TableCell className="hidden max-w-0 truncate md:table-cell">
          {meeting.location ?? "—"}
        </TableCell>
        {showRepColumn && (
          <TableCell className="align-top md:max-w-0 md:align-middle">
            <div className="whitespace-normal md:truncate">
              <Link
                href={`/representatives/${meeting.representative_bioguide_id}`}
                className={LINK_CN}
                onClick={(e) => e.stopPropagation()}
              >
                {meeting.representative_district === null ? "Sen. " : "Rep. "}
                {meeting.representative_name}
              </Link>{" "}
              <Pronouns pronouns={meeting.representative_pronouns} /> —{" "}
              {meeting.representative_state} (
              {meeting.representative_party[0] ?? "?"})
            </div>
            <MeetingMetaMobile meeting={meeting} includeDate />
          </TableCell>
        )}
        <TableCell className="hidden max-w-0 truncate md:table-cell">
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
        <TableCell className="hidden max-w-0 truncate md:table-cell">
          {meeting.scheduling_lead_name ?? "—"}
        </TableCell>
        {isPast && (
          <TableCell className="text-center">
            {meeting.follow_up_date ? (
              <CircleCheckBig
                role="img"
                aria-label="Follow-up sent"
                className="m-auto h-4 w-4 text-green-600"
              />
            ) : null}
          </TableCell>
        )}
      </TableRow>
      <TableRow
        id={detailRowId}
        className={isExpanded ? "hover:bg-background" : "hidden"}
      >
        {isExpanded && (
          <TableCell colSpan={colSpan} className="whitespace-normal p-0">
            <MeetingDetail meeting={meeting} onSaved={onRefresh} />
          </TableCell>
        )}
      </TableRow>
    </>
  );
}
