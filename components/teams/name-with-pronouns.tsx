import { displayName, type MembershipWithProfile } from "@/lib/teams";

export function NameWithPronouns({
  profiles,
}: {
  profiles: MembershipWithProfile["profiles"];
}) {
  return (
    <>
      {displayName(profiles)}
      {profiles?.pronouns && (
        <span className="ml-1 text-sm italic text-muted-foreground">
          {profiles.pronouns}
        </span>
      )}
    </>
  );
}
