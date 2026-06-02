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

export function MeetingsSection({
  title,
  meetings,
  totalCount,
  onShowMore,
  disableLoadMore,
  onRefresh = () => {},
  isPast = false,
}: {
  title: string;
  meetings: MeetingRowType[];
  totalCount: number;
  onShowMore: () => void;
  disableLoadMore: boolean;
  onRefresh?: () => void;
  isPast?: boolean;
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  const hasMore = meetings.length < totalCount;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-2xl font-bold">
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
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-24">Time</TableHead>
                <TableHead className="w-56">Member of Congress</TableHead>
                <TableHead className="w-36">Staff Contact</TableHead>
                <TableHead className="w-52">PIH Team</TableHead>
                <TableHead className="w-36">Scheduling Lead</TableHead>
                {isPast && (
                  <TableHead className="text-center">Follow-up</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  isPast={isPast}
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
