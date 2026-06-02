"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { formatTime } from "@/lib/meetings/format";
import { MeetingDetail } from "@/components/meetings/meeting-detail";

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MeetingRow({
  meeting,
  isPast = false,
}: {
  meeting: MeetingRowType;
  isPast?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const colSpan = isPast ? 8 : 7;
  const detailRowId = `meeting-detail-${meeting.id}`;

  const toggle = () => {
    setHasExpanded(true);
    setIsExpanded((v) => !v);
  };

  return (
    <>
      <TableRow
        className={`has-aria-expanded:bg-accent cursor-pointer hover:bg-accent${isExpanded ? "bg-accent" : ""}`}
        onClick={toggle}
      >
        <TableCell>
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
        <TableCell>{formatDate(meeting.meeting_date)}</TableCell>
        <TableCell>
          {meeting.meeting_time
            ? formatTime(
                meeting.meeting_date,
                meeting.meeting_time,
                meeting.meeting_timezone,
              )
            : "—"}
        </TableCell>
        <TableCell className="max-w-0">
          <div className="truncate">
            <Link
              href={`/representatives/${meeting.representative_bioguide_id}`}
              className="text-primary-dark underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {meeting.representative_district === null ? "Sen. " : "Rep. "}
              {meeting.representative_name}
            </Link>{" "}
            — {meeting.representative_state} (
            {meeting.representative_party[0] ?? "?"})
          </div>
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
        <TableCell className="max-w-0">
          {meeting.primary_team_slug ? (
            <Link
              href={`/teams/${meeting.primary_team_slug}`}
              className="block truncate text-primary-dark underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {meeting.primary_team_name}
            </Link>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="max-w-0 truncate">
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
      {hasExpanded && (
        <TableRow
          id={detailRowId}
          className="hover:bg-background"
          hidden={!isExpanded}
        >
          <TableCell colSpan={colSpan} className="whitespace-normal p-0">
            <MeetingDetail meeting={meeting} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
