"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  MeetingDetail,
  DelegationMember,
  DelegationRole,
} from "@/lib/meetings/types";

const ROLE_LABELS: Record<DelegationRole, string> = {
  scheduling_lead: "Scheduling Lead",
  attendee_talking: "Attendee (Talking)",
  attendee_listening: "Attendee (Listening)",
  pih_team_member: "PIH Team Member",
  note_taker: "Note Taker",
};

const MEMBER_ROLE_COLORS: Partial<Record<DelegationRole, string>> = {
  attendee_talking: "bg-blue-500 text-white",
  attendee_listening: "bg-violet-500 text-white",
  note_taker: "bg-amber-500 text-white",
};

const SECTION_LABEL_CLASSNAME =
  "font-semibold uppercase tracking-wide text-muted-foreground";

const MEMBER_ROLES: DelegationRole[] = [
  "attendee_talking",
  "attendee_listening",
  "note_taker",
];

function MemberAvatar({ member }: { member: DelegationMember }) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colorClass =
    MEMBER_ROLE_COLORS[member.role] ?? "bg-muted text-foreground";

  useEffect(() => {
    if (!clicked) return;
    function handleClose(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setClicked(false);
        return;
      }
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("keydown", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleClose);
    };
  }, [clicked]);

  return (
    <TooltipProvider>
      <Tooltip open={hovered || clicked}>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => setClicked((v) => !v)}
            aria-label={`${member.display_name} — ${ROLE_LABELS[member.role]}`}
          >
            {initials(member.display_name)}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-48 bg-accent text-accent-foreground"
          arrowClassName="bg-accent fill-accent"
        >
          <p className="text-sm font-bold">{ROLE_LABELS[member.role]}</p>
          <p className="text-sm font-medium">{member.display_name}</p>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="text-sm italic underline-offset-4 hover:underline"
            >
              {member.email}
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
  onEdit?: () => void;
}) {
  return (
    <div className="p-4">
      <div className="grid gap-6 @[600px]:grid-cols-2">
        <div className="flex flex-col gap-4">
          {(() => {
            const isPast =
              meeting.meeting_date < new Date().toISOString().slice(0, 10);
            const showChampion = isPast || meeting.champion_score != null;
            const showFollowUp = isPast || meeting.follow_up_date != null;
            if (!showChampion && !showFollowUp) return null;
            return (
              <div className="flex gap-6">
                {showChampion && (
                  <div>
                    <p className={SECTION_LABEL_CLASSNAME}>Champion Level</p>
                    <p className="mt-1 text-sm">
                      {meeting.champion_score != null
                        ? `${meeting.champion_score} – ${CHAMPION_LABELS[meeting.champion_score] ?? "Unknown"}`
                        : "—"}
                    </p>
                  </div>
                )}
                {showFollowUp && (
                  <div>
                    <p className={SECTION_LABEL_CLASSNAME}>Follow-up</p>
                    <p className="mt-1 text-sm">
                      {meeting.follow_up_date
                        ? new Date(
                            meeting.follow_up_date + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
          {meeting.notes && (
            <div>
              <p className={SECTION_LABEL_CLASSNAME}>Notes</p>
              <div className="mt-1 border-l-4 border-muted pl-3">
                <p className="text-sm">{meeting.notes}</p>
              </div>
            </div>
          )}
          {meeting.links.length > 0 && (
            <div>
              <p className={SECTION_LABEL_CLASSNAME}>Links</p>
              <ul className="mt-1 flex flex-col gap-1">
                {meeting.links.map((link) => (
                  <li key={`${link.label}::${link.url}`}>
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
          {meeting.location && (
            <div>
              <p className={SECTION_LABEL_CLASSNAME}>Location</p>
              <p className="mt-1 text-sm">{meeting.location}</p>
            </div>
          )}
          <div>
            <p className={SECTION_LABEL_CLASSNAME}>Delegation</p>
            {meeting.delegation_members.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">None</p>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {(
                  ["scheduling_lead", "pih_team_member"] as DelegationRole[]
                ).flatMap((role) =>
                  meeting.delegation_members
                    .filter((m) => m.role === role)
                    .map((m) => (
                      <div key={m.id} className="flex flex-col gap-0.5">
                        <span className="text-sm text-muted-foreground">
                          {ROLE_LABELS[m.role]}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                          >
                            {initials(m.display_name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="text-sm font-medium">
                              {m.display_name}
                            </span>
                            {m.email && (
                              <a
                                href={`mailto:${m.email}`}
                                className="ml-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                              >
                                {m.email}
                              </a>
                            )}
                          </span>
                        </span>
                      </div>
                    )),
                )}
                {(() => {
                  const attendees = meeting.delegation_members.filter((m) =>
                    MEMBER_ROLES.includes(m.role),
                  );
                  if (attendees.length === 0) return null;
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">
                        Attendees
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {attendees.map((m) => (
                          <MemberAvatar key={m.id} member={m} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          {onEdit && (
            <div className="mt-auto pt-2">
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit Meeting
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
