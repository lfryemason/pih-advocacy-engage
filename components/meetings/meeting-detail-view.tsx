"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingDetail } from "@/lib/meetings/types";
import {
  formatDate,
  formatTime,
  EMPTY_VALUE_CLASSNAME,
  LINK_CN,
  SECTION_LABEL_CLASSNAME,
} from "@/lib/meetings/format";
import { localDateString } from "@/lib/utils";
import {
  MEMBER_ROLES,
  ROLE_LABELS,
  CHAMPION_LABELS,
} from "@/lib/meetings/meeting-roles";
import { MemberAvatar } from "@/components/meetings/member-avatar";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";
import { NameWithPronouns } from "@/components/teams/name-with-pronouns";
import { RepresentativeLink } from "@/components/meetings/representative-link";
import { StafferDisplay } from "@/components/meetings/staffer-display";

function Field({
  label,
  isEmpty,
  children,
}: {
  label: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className={SECTION_LABEL_CLASSNAME}>{label}</p>
      {isEmpty ? <p className={EMPTY_VALUE_CLASSNAME}>—</p> : children}
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
  const isPast = meeting.meeting_date < localDateString();
  const showChampion = isPast || meeting.champion_score != null;
  const showFollowUp =
    isPast || meeting.follow_up_date != null || meeting.follow_up_completed;
  const schedulingLeads = meeting.delegation_members.filter(
    (m) => m.role === "scheduling_lead",
  );
  const expertMembers = meeting.delegation_members.filter(
    (m) => m.role === "expert",
  );
  const attendees = meeting.delegation_members
    .filter((m) => MEMBER_ROLES.includes(m.role))
    .sort(
      (a, b) => MEMBER_ROLES.indexOf(a.role) - MEMBER_ROLES.indexOf(b.role),
    );
  const hasDelegationContent = expertMembers.length > 0 || attendees.length > 0;

  return (
    <div className="p-4">
      <div className="grid gap-6 @[600px]:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field
            label={ROLE_LABELS.scheduling_lead}
            isEmpty={schedulingLeads.length === 0}
          >
            <div className="mt-1 flex flex-col gap-2">
              {schedulingLeads.map((lead) => (
                <span key={lead.id} className="flex items-center gap-2">
                  <AvatarInitialsCircle
                    firstName={lead.first_name}
                    lastName={lead.last_name}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium">
                      <NameWithPronouns
                        name={lead.display_name}
                        pronouns={lead.pronouns}
                      />
                    </span>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="ml-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        {lead.email}
                      </a>
                    )}
                  </span>
                </span>
              ))}
            </div>
          </Field>
          <div>
            <p className={SECTION_LABEL_CLASSNAME}>Member of Congress</p>
            <p className="mt-1 text-sm">
              <RepresentativeLink meeting={meeting} linked />
            </p>
          </div>
          {(showChampion || showFollowUp) && (
            <div className="flex gap-6">
              {showChampion && (
                <Field
                  label="Champion Level"
                  isEmpty={meeting.champion_score == null}
                >
                  <p className="mt-1 text-sm">
                    {meeting.champion_score != null &&
                      `${meeting.champion_score} – ${CHAMPION_LABELS[meeting.champion_score] ?? "Unknown"}`}
                  </p>
                </Field>
              )}
              {showFollowUp && (
                <Field
                  label="Follow-up"
                  isEmpty={
                    !meeting.follow_up_date && !meeting.follow_up_completed
                  }
                >
                  <p className="mt-1 text-sm">
                    {meeting.follow_up_completed
                      ? "Completed"
                      : "Not completed"}
                    {meeting.follow_up_date &&
                      ` (${formatDate(meeting.follow_up_date)})`}
                  </p>
                </Field>
              )}
            </div>
          )}
          <div>
            <p className={SECTION_LABEL_CLASSNAME}>Staffer</p>
            <p className="mt-1 text-sm">
              <StafferDisplay meeting={meeting} />
            </p>
          </div>
          <Field label="Location" isEmpty={!meeting.location}>
            <p className="mt-1 text-sm">{meeting.location}</p>
          </Field>
          <Field label="Notes" isEmpty={!meeting.notes}>
            <div className="mt-1 border-l-4 border-muted pl-3">
              <p className="text-sm">{meeting.notes}</p>
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-6">
            <div>
              <p className={SECTION_LABEL_CLASSNAME}>Date</p>
              <p className="mt-1 text-sm">{formatDate(meeting.meeting_date)}</p>
            </div>
            <Field label="Time" isEmpty={!meeting.meeting_time}>
              <p className="mt-1 text-sm">
                {meeting.meeting_time &&
                  formatTime(
                    meeting.meeting_date,
                    meeting.meeting_time,
                    meeting.meeting_timezone,
                  )}
              </p>
            </Field>
          </div>
          <Field label="Primary PIH Team" isEmpty={!meeting.primary_team_name}>
            <p className="mt-1 text-sm">{meeting.primary_team_name}</p>
          </Field>
          <Field label="Delegation" isEmpty={!hasDelegationContent}>
            <div className="mt-2 flex flex-col gap-3">
              {expertMembers.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Expert</span>
                  <div className="flex flex-wrap gap-1.5">
                    {expertMembers.map((m) => (
                      <MemberAvatar key={m.id} member={m} />
                    ))}
                  </div>
                </div>
              )}
              {attendees.length > 0 && (
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
              )}
            </div>
          </Field>
          <Field
            label="Represented teams"
            isEmpty={meeting.represented_teams.length === 0}
          >
            <ul
              aria-label="Represented teams"
              className="mt-1 flex flex-wrap gap-1"
            >
              {meeting.represented_teams.map((name, index) => (
                <li key={name} className="text-xs text-muted-foreground">
                  {name}
                  {index < meeting.represented_teams.length - 1 && ","}
                </li>
              ))}
            </ul>
          </Field>
          <Field label="Links" isEmpty={meeting.links.length === 0}>
            <ul className="mt-1 flex flex-col gap-1">
              {meeting.links.map((link) => (
                <li key={`${link.label}::${link.url}`}>
                  <a
                    href={
                      URL.canParse(link.url) ? link.url : `https://${link.url}`
                    }
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
          </Field>
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
