"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { MeetingDetail } from "@/components/meetings/meeting-detail";

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(
  meetingDate: string,
  time: string,
  timezone: string,
): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  const minuteStr = m.toString().padStart(2, "0");
  let tzAbbr = "";
  try {
    const refDate = new Date(`${meetingDate}T12:00:00Z`);
    tzAbbr =
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short",
      })
        .formatToParts(refDate)
        .find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {}
  return tzAbbr
    ? `${hour12}:${minuteStr} ${ampm} ${tzAbbr}`
    : `${hour12}:${minuteStr} ${ampm}`;
}

export function MeetingRow({
  meeting,
  isPast = false,
  onRefresh = () => {},
}: {
  meeting: MeetingRowType;
  isPast?: boolean;
  onRefresh?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colSpan = isPast ? 8 : 7;
  const detailRowId = `meeting-detail-${meeting.id}`;

  return (
    <>
      <TableRow
        className={`cursor-pointer ${isExpanded ? "bg-accent hover:bg-accent" : "hover:bg-accent"}`}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Expand meeting with ${meeting.representative_name}`}
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? detailRowId : undefined}
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
                aria-label="Follow-up sent"
                className="m-auto h-4 w-4 text-green-600"
              />
            ) : null}
          </TableCell>
        )}
      </TableRow>
      {isExpanded && (
        <TableRow id={detailRowId} className="hover:bg-background">
          <TableCell colSpan={colSpan} className="p-0">
            <MeetingDetail meeting={meeting} onSaved={onRefresh} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
