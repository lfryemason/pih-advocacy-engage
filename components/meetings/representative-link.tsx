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
  linked = false,
}: {
  meeting: RepresentativeLinkMeeting;
  linked?: boolean;
}) {
  const prefix = meeting.representative_district === null ? "Sen. " : "Rep. ";
  return (
    <>
      {linked ? (
        <Link
          href={`/representatives/${meeting.representative_bioguide_id}`}
          className={LINK_CN}
        >
          {prefix}
          {meeting.representative_name}
        </Link>
      ) : (
        <>
          {prefix}
          {meeting.representative_name}
        </>
      )}{" "}
      <Pronouns pronouns={meeting.representative_pronouns} /> —{" "}
      {meeting.representative_state} ({meeting.representative_party[0] ?? "?"})
    </>
  );
}
