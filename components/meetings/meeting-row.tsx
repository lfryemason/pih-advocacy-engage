"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { formatDate, formatTime } from "@/lib/meetings/format";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { RepresentativeLink } from "@/components/meetings/representative-link";
import { StafferDisplay } from "@/components/meetings/staffer-display";

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
              <RepresentativeLink
                meeting={meeting}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </TableCell>
        )}
        <TableCell className="max-w-0 truncate">
          <StafferDisplay meeting={meeting} />
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
