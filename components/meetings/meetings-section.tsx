"use client";

import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { MeetingRow } from "@/components/meetings/meeting-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export type MeetingsSectionVariant = "default" | "pink" | "teal";

const HEADER_COLOR: Record<MeetingsSectionVariant, string> = {
  default: "",
  pink: "[&_tr]:bg-secondary-magenta [&_tr]:hover:bg-secondary-magenta [&_th]:text-secondary-magenta-foreground",
  teal: "[&_tr]:bg-secondary-teal [&_tr]:hover:bg-secondary-teal [&_th]:text-secondary-teal-foreground",
};

const UPCOMING_ROW_CLASS: Partial<Record<MeetingsSectionVariant, string>> = {
  pink: "bg-pink-50 dark:bg-pink-950/30",
  teal: "bg-blue-50 dark:bg-blue-950/30",
};

export function MeetingsSection({
  title,
  meetings,
  totalCount,
  onShowMore,
  disableLoadMore,
  onRefresh = () => {},
  isPast = false,
  upcomingCount = 0,
  showRepColumn = true,
  variant = "default",
  compact = false,
}: {
  title: string;
  meetings: MeetingRowType[];
  totalCount: number;
  onShowMore: () => void;
  disableLoadMore: boolean;
  onRefresh?: () => void;
  isPast?: boolean;
  upcomingCount?: number;
  showRepColumn?: boolean;
  variant?: MeetingsSectionVariant;
  compact?: boolean;
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const hasMore = meetings.length < totalCount;
  const headingClass = compact ? "text-xl font-semibold" : "text-2xl font-bold";

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className={`mb-3 ${headingClass}`}>
        {title}
      </h2>
      {totalCount === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No meetings found.
        </p>
      ) : (
        <>
          <Table>
            <caption className="sr-only">{title}</caption>
            <TableHeader className={HEADER_COLOR[variant]}>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-24">Time</TableHead>
                {showRepColumn && (
                  <TableHead className="w-56">Member of Congress</TableHead>
                )}
                <TableHead className="w-36">Staff Contact</TableHead>
                <TableHead className="w-52">PIH Team</TableHead>
                <TableHead className="w-36">Scheduler/Follow-up</TableHead>
                {isPast && meetings.length > upcomingCount && (
                  <TableHead className="text-center">Follow-up</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting, index) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  isPast={isPast && index >= upcomingCount}
                  upcomingClassName={
                    index < upcomingCount
                      ? UPCOMING_ROW_CLASS[variant]
                      : undefined
                  }
                  showRepColumn={showRepColumn}
                  onRefresh={onRefresh}
                />
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={onShowMore}
                disabled={disableLoadMore}
              >
                {disableLoadMore
                  ? "Loading…"
                  : `Show more (${totalCount - meetings.length} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
