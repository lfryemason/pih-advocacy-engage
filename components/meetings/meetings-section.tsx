"use client";

import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { MeetingRow } from "@/components/meetings/meeting-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = 5;

export function MeetingsSection({
  title,
  meetings = [],
  totalCount = 0,
  onShowMore = () => {},
  disableLoadMore = false,
  onRefresh = () => {},
  isPast = false,
  showRepColumn = true,
  loading = false,
}: {
  title: string;
  meetings?: MeetingRowType[];
  totalCount?: number;
  onShowMore?: () => void;
  disableLoadMore?: boolean;
  onRefresh?: () => void;
  isPast?: boolean;
  showRepColumn?: boolean;
  loading?: boolean;
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const hasMore = meetings.length < totalCount;
  const columnCount = (isPast ? 8 : 7) - (showRepColumn ? 0 : 1);

  const header = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <span className="sr-only">Actions</span>
        </TableHead>
        <TableHead className="w-28">Date</TableHead>
        <TableHead className="w-24">Time</TableHead>
        <TableHead className="w-52">Location</TableHead>
        {showRepColumn && (
          <TableHead className="w-56">Member of Congress</TableHead>
        )}
        <TableHead className="w-36">Staff Contact</TableHead>
        <TableHead className="w-36">Scheduler/Follow-up</TableHead>
        {isPast && <TableHead className="text-center">Follow-up</TableHead>}
      </TableRow>
    </TableHeader>
  );

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-2xl font-bold">
        {title}
      </h2>
      {loading ? (
        <Table>
          <caption className="sr-only">{title}</caption>
          {header}
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, row) => (
              <TableRow key={row}>
                {Array.from({ length: columnCount }).map((_, col) => (
                  <TableCell key={col}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : totalCount === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No meetings found.
        </p>
      ) : (
        <>
          <Table>
            <caption className="sr-only">{title}</caption>
            {header}
            <TableBody>
              {meetings.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  isPast={isPast}
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
