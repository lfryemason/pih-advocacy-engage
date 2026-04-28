import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { Dot } from "lucide-react";

function displayName(profiles: MembershipWithProfile["profiles"]) {
  if (!profiles) return "—";
  return (
    [profiles.first_name, profiles.last_name].filter(Boolean).join(" ") || "—"
  );
}

export function LeadSection({
  title,
  members,
}: {
  title: string;
  members: MembershipWithProfile[];
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="text-lg font-semibold uppercase tracking-wide">
        {members.length > 1 ? `${title}s` : title}
      </h3>
      {members.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={`${m.user_id}-${m.role}`} className="text-foreground">
              <span className="flex">
                <span></span>
                {displayName(m.profiles)}

                {m.profiles?.pronouns && (
                  <>
                    <Dot />
                    <span>{m.profiles.pronouns}</span>
                  </>
                )}
              </span>
              <span className="block">{m.profiles?.email ?? ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
