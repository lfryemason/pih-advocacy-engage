import type { MembershipWithProfile } from "@/lib/teams";
import { displayName } from "@/lib/teams";
import { Dot, LucideAmpersand } from "lucide-react";

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
                    aria-hidden="true"
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
                    <Dot aria-hidden="true" />
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
