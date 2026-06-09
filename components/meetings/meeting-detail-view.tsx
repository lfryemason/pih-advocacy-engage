"use client";

import { cn } from "@/lib/utils";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  MeetingDetail,
  DelegationMember,
  DelegationRole,
} from "@/lib/meetings/types";
import {
  formatDate,
  formatTime,
  LINK_CN,
  SECTION_LABEL_CLASSNAME,
} from "@/lib/meetings/format";
import {
  MEMBER_ROLES,
  ROLE_LABELS,
  CHAMPION_LABELS,
} from "@/lib/meetings/meeting-roles";
import { MemberAvatar } from "@/components/meetings/member-avatar";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";
import { NameWithPronouns } from "@/components/teams/name-with-pronouns";

function DelegationMemberRow({ member }: { member: DelegationMember }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted-foreground">
        {ROLE_LABELS[member.role]}
      </span>
      <span className="flex items-center gap-2">
        <AvatarInitialsCircle
          firstName={member.first_name}
          lastName={member.last_name}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="text-sm font-medium">
            <NameWithPronouns
              name={member.display_name}
              pronouns={member.pronouns}
            />
          </span>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="ml-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {member.email}
            </a>
          )}
        </span>
      </span>
    </div>
  );
}

export function MeetingDetailView({
  meeting,
  onEdit,
}: {
  meeting: MeetingDetail;
  onEdit?: () => void;
}) {
  const isPast = meeting.meeting_date < new Date().toISOString().slice(0, 10);
  const showChampion = isPast || meeting.champion_score != null;
  const showFollowUp = isPast || meeting.follow_up_date != null;

  return (
    <div className="p-4">
      <div className="grid gap-6 @[600px]:grid-cols-2">
        <div className="flex flex-col gap-4">
          {(showChampion || showFollowUp) && (
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
                      ? formatDate(meeting.follow_up_date)
                      : "—"}
                  </p>
                </div>
              )}
            </div>
          )}
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
                      className={cn(
                        "inline-flex items-center gap-1 text-sm",
                        LINK_CN,
                      )}
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
          {meeting.meeting_time && (
            <div>
              <p className={SECTION_LABEL_CLASSNAME}>Time</p>
              <p className="mt-1 text-sm">
                {formatTime(
                  meeting.meeting_date,
                  meeting.meeting_time,
                  meeting.meeting_timezone,
                )}
              </p>
            </div>
          )}
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
                    .map((m) => <DelegationMemberRow key={m.id} member={m} />),
                )}
                {(() => {
                  const attendees = meeting.delegation_members
                    .filter(
                      (m) =>
                        MEMBER_ROLES.includes(m.role) &&
                        m.role !== "pih_team_member",
                    )
                    .sort(
                      (a, b) =>
                        MEMBER_ROLES.indexOf(a.role) -
                        MEMBER_ROLES.indexOf(b.role),
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
