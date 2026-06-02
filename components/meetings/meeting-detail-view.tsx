"use client";

import { ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingDetail, DelegationRole } from "@/lib/meetings/types";

const ROLE_LABELS: Record<DelegationRole, string> = {
  scheduling_lead: "Scheduling Lead",
  attendee_talking: "Attendee (Talking)",
  attendee_listening: "Attendee (Listening)",
  pih_team_member: "PIH Team Member",
  note_taker: "Note Taker",
};

const CHAMPION_LABELS: Record<number, string> = {
  0: "Opposed",
  1: "Skeptic",
  2: "Neutral",
  3: "Supporter",
  4: "Advocate",
  5: "Champion",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MeetingDetailView({
  meeting,
  onEdit,
}: {
  meeting: MeetingDetail;
  onEdit: () => void;
}) {
  const pihMembers = meeting.delegation_members.filter(
    (m) => m.role === "pih_team_member",
  );

  return (
    <div className="border-t p-6">
      <div className="flex items-start gap-4">
        <div className="grid flex-1 gap-6 @[600px]:grid-cols-2">
          <div className="flex flex-col gap-4">
            {meeting.location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                <p className="mt-1 text-sm">{meeting.location}</p>
              </div>
            )}
            {meeting.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <div className="mt-1 border-l-4 border-muted pl-3">
                  <p className="text-sm">{meeting.notes}</p>
                </div>
              </div>
            )}
            {meeting.links.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Links
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {meeting.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-dark underline-offset-4 hover:underline"
                      >
                        <ExternalLink
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0"
                        />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delegation
              </p>
              {meeting.delegation_members.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-2">
                  {meeting.delegation_members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                      >
                        {initials(m.display_name)}
                      </span>
                      <span className="text-sm">{m.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        — {ROLE_LABELS[m.role]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {pihMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  PIH Team Member
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {pihMembers.map((m) => (
                    <li key={m.id} className="text-sm">
                      {m.display_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meeting.champion_score != null && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Champion Level
                </p>
                <p className="mt-1 text-sm">
                  {meeting.champion_score} –{" "}
                  {CHAMPION_LABELS[meeting.champion_score] ?? ""}
                </p>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Edit meeting"
          onClick={onEdit}
          className="shrink-0"
        >
          <Settings aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
