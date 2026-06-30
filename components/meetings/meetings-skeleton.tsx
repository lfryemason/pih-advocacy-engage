import { MeetingsSection } from "@/components/meetings/meetings-section";

export function MeetingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Updating meetings"
      className="flex flex-col gap-10"
    >
      <MeetingsSection title="Upcoming Meetings" loading />
      <MeetingsSection title="Past Meetings" loading isPast />
    </div>
  );
}
