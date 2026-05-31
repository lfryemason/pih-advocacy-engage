"use client";

import { Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { displayName, type MembershipWithProfile } from "@/lib/teams";

const LEADERSHIP_ROLES = [
  { role: "team_coordinator", label: "Team Coordinator" },
  { role: "advocacy_lead", label: "Advocacy Lead" },
  { role: "community_building_lead", label: "Community Building Lead" },
  { role: "fundraising_lead", label: "Fundraising Lead" },
] as const;

export function TeamLeadSectionList({
  memberships,
  meetingCounts = {},
}: {
  memberships: MembershipWithProfile[];
  meetingCounts?: Record<string, number>;
}) {
  const byRole: Record<string, MembershipWithProfile[]> = {};
  for (const m of memberships) {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  }

  return (
    <div className="mt-8">
      <Table>
        <caption className="sr-only">Team Leadership</caption>
        <TableHeader className="[&_th]:text-white [&_tr]:bg-teal-600 [&_tr]:hover:bg-teal-600">
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Meetings this year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LEADERSHIP_ROLES.map(({ role, label }) => {
            const members = byRole[role] ?? [];
            if (members.length === 0) {
              return (
                <TableRow key={role}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              );
            }
            return members.map((m, i) => (
              <TableRow key={`${m.user_id}-${m.role}-${i}`}>
                <TableCell className="font-medium">
                  {i === 0 ? label : ""}
                </TableCell>
                <TableCell>
                  {displayName(m.profiles)}
                  {m.profiles?.pronouns && (
                    <span className="ml-1 text-sm italic text-muted-foreground">
                      {m.profiles.pronouns}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {m.profiles?.email && (
                    <a
                      href={`mailto:${m.profiles.email}`}
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <Mail size={14} aria-hidden="true" />
                      {m.profiles.email}
                    </a>
                  )}
                </TableCell>
                <TableCell>{meetingCounts[m.user_id] ?? 0}</TableCell>
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>
    </div>
  );
}
