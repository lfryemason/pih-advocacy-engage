"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MeetingRow({ meeting }: { meeting: MeetingRowType }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TableRow>
      <TableCell>{formatDate(meeting.meeting_date)}</TableCell>
      <TableCell>
        <Link
          href={`/representatives/${meeting.representative_bioguide_id}`}
          className="hover:underline"
        >
          {meeting.representative_name}
        </Link>
      </TableCell>
      <TableCell>{meeting.congressional_contact_name}</TableCell>
      <TableCell>{meeting.primary_team_name ?? "—"}</TableCell>
      <TableCell>{meeting.scheduling_lead_name ?? "—"}</TableCell>
      <TableCell>
        {meeting.follow_up_date ? formatDate(meeting.follow_up_date) : "—"}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            isExpanded
              ? `Collapse meeting with ${meeting.representative_name}`
              : `Expand meeting with ${meeting.representative_name}`
          }
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </TableCell>
    </TableRow>
  );
}
