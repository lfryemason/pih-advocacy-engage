import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { Dot, LucideAmpersand } from "lucide-react";

function displayName(profiles: MembershipWithProfile["profiles"]) {
  if (!profiles) return "—";
  return (
    [profiles.first_name, profiles.last_name].filter(Boolean).join(" ") || ""
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
      <h2 className="text-lg font-semibold uppercase tracking-wide">
        {members.length > 1 ? `${title}s` : title}
      </h2>
      {members.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-col">
          {members.map((m, i) => (
            <li key={`${m.user_id}-${m.role}`} className="text-foreground">
              {i > 0 && (
                <div className="flex justify-center py-2">
                  <LucideAmpersand
                    size={16}
                    className="text-muted-foreground"
                  />
                </div>
              )}
              <span className="flex text-center">
                <span className="flex-grow text-center">
                  {displayName(m.profiles)}
                </span>

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
