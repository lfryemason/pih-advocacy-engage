import type { MeetingRow } from "@/lib/meetings/types";

type StafferDisplayMeeting = Pick<
  MeetingRow,
  | "congressional_contact_id"
  | "congressional_contact_name"
  | "representative_district"
>;

export function StafferDisplay({
  meeting,
}: {
  meeting: StafferDisplayMeeting;
}) {
  if (meeting.congressional_contact_id === null) {
    return (
      <em>
        {meeting.representative_district === null
          ? "Senator"
          : "Representative"}
      </em>
    );
  }
  return <>{meeting.congressional_contact_name}</>;
}
