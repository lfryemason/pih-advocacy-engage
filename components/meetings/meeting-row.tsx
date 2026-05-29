"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";

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

  return (
    <TableRow>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Expand meeting with ${meeting.representative_name}`}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((v) => !v)}
        >
          {isExpanded ? (
            <ChevronDown aria-hidden="true" className={`h-4 w-4`} />
          ) : (
            <ChevronRight aria-hidden="true" className={`h-4 w-4`} />
          )}
        </Button>
      </TableCell>
      <TableCell>{formatDate(meeting.meeting_date)}</TableCell>
      <TableCell>{meeting.meeting_time ?? "—"}</TableCell>
      <TableCell className="max-w-0">
        <div className="truncate">
          <Link
            href={`/representatives/${meeting.representative_bioguide_id}`}
            className="text-primary-dark underline-offset-4 hover:underline"
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
  );
}
