import Link from "next/link";
import { LINK_CN } from "@/lib/meetings/format";
import { Pronouns } from "@/components/pronouns";
import type { MeetingRow } from "@/lib/meetings/types";

type RepresentativeLinkMeeting = Pick<
  MeetingRow,
  | "representative_bioguide_id"
  | "representative_district"
  | "representative_name"
  | "representative_pronouns"
  | "representative_state"
  | "representative_party"
>;

export function RepresentativeLink({
  meeting,
  onClick,
}: {
  meeting: RepresentativeLinkMeeting;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      <Link
        href={`/representatives/${meeting.representative_bioguide_id}`}
        className={LINK_CN}
        onClick={onClick}
      >
        {meeting.representative_district === null ? "Sen. " : "Rep. "}
        {meeting.representative_name}
      </Link>{" "}
      <Pronouns pronouns={meeting.representative_pronouns} /> —{" "}
      {meeting.representative_state} ({meeting.representative_party[0] ?? "?"})
    </>
  );
}
