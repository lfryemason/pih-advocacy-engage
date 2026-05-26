import { MeetingRow as MeetingRowType } from "@/lib/meetings/types";
import { MeetingRow } from "@/components/meetings/meeting-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MeetingsSection({
  title,
  meetings,
}: {
  title: string;
  meetings: MeetingRowType[];
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-2xl font-bold">
        {title}
      </h2>
      {meetings.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No meetings found.
        </p>
      ) : (
        <Table>
          <caption className="sr-only">{title}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Member of Congress</TableHead>
              <TableHead>Staff Contact</TableHead>
              <TableHead>PIH Team</TableHead>
              <TableHead>Scheduling Lead</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
