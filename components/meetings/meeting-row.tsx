"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { formatDate, formatTime } from "@/lib/meetings/format";
import { isDelegationMember } from "@/lib/meetings/permissions";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { RepresentativeLink } from "@/components/meetings/representative-link";
import { StafferDisplay } from "@/components/meetings/staffer-display";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

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
  const [isEditing, setIsEditing] = useState(false);
  const { userId, isAdmin, isFacilitator } = useCurrentUser();
  const canViewDetails =
    isPast ||
    isAdmin ||
    isFacilitator ||
    isDelegationMember(userId, meeting.delegation_user_ids);
  const colSpan = 6 + (showRepColumn ? 1 : 0) + (isPast ? 1 : 0);
  const detailRowId = `meeting-detail-${meeting.id}`;

  const toggle = () => {
    if (isExpanded && isEditing) return;
    setIsExpanded((v) => !v);
  };

  const expandAriaProps = {
    "aria-expanded": isExpanded,
    "aria-controls": detailRowId,
  } as const;

  const interactiveRowProps = canViewDetails
    ? {
        tabIndex: 0,
        onClick: toggle,
        onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          toggle();
        },
        "aria-controls": detailRowId,
      }
    : {};

  return (
    <>
      <TableRow
        className={cn(
          canViewDetails &&
            "cursor-pointer outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isExpanded && "bg-accent",
        )}
        {...interactiveRowProps}
      >
        <TableCell>
          <div className="flex size-9 items-center justify-center">
            {canViewDetails && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Expand meeting with ${meeting.representative_name}`}
                {...expandAriaProps}
                disabled={isExpanded && isEditing}
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
            )}
          </div>
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
          {canViewDetails ? (
            (meeting.location ?? "—")
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <EyeOff
                    aria-label="Location hidden"
                    tabIndex={0}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  Location is only shown to delegation members. Contact the
                  scheduler/follow-up to be added to the meeting.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </TableCell>
        {showRepColumn && (
          <TableCell className="max-w-0">
            <div className="truncate">
              <RepresentativeLink meeting={meeting} />
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
            {meeting.follow_up_completed ? (
              <CircleCheckBig
                role="img"
                aria-label="Follow-up completed"
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
            <MeetingDetail
              meeting={meeting}
              onSaved={onRefresh}
              onEditingChange={setIsEditing}
            />
          </TableCell>
        )}
      </TableRow>
    </>
  );
}
