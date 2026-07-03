"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { formatDate, formatTime, LINK_CN } from "@/lib/meetings/format";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { Pronouns } from "@/components/pronouns";

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
  const colSpan = 6 + (showRepColumn ? 1 : 0);
  const detailRowId = `meeting-detail-${meeting.id}`;

  const toggle = () => setIsExpanded((v) => !v);

  return (
    <>
      <TableRow
        className={`cursor-pointer hover:bg-accent ${isExpanded ? "bg-accent" : ""}`}
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
        <TableCell className="max-w-0 truncate">
          {meeting.location ?? "—"}
        </TableCell>
        {showRepColumn && (
          <TableCell className="max-w-0">
            <div className="truncate">
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
          </TableCell>
        )}
        <TableCell className="max-w-0 truncate">
          {meeting.congressional_contact_id === null ? (
            <em>
              {meeting.representative_district === null
                ? "Senator"
                : "Representative"}
            </em>
          ) : (
            meeting.congressional_contact_name
          )}
        </TableCell>
        {isPast ? (
          <TableCell className="text-center">
            {meeting.follow_up_completed ? (
              <CircleCheckBig
                role="img"
                aria-label="Follow-up completed"
                className="m-auto h-4 w-4 text-green-600"
              />
            ) : null}
          </TableCell>
        ) : (
          <TableCell className="max-w-0 truncate">
            {meeting.scheduling_lead_name ?? "—"}
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
