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
import { LEADERSHIP_ROLES, type MembershipWithProfile } from "@/lib/teams";
import { NameWithPronouns } from "@/components/teams/name-with-pronouns";

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
      <h2 className="text-lg font-semibold mb-2">Team Leadership</h2>
      <Table>
        <TableHeader className="[&_th]:text-secondary-teal-foreground [&_tr]:bg-secondary-teal [&_tr]:hover:bg-secondary-teal">
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Meetings in Last Year</TableHead>
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
                  <NameWithPronouns profiles={m.profiles} />
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
