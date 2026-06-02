"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { displayName, type MembershipWithProfile } from "@/lib/teams";

export type { MembershipWithProfile };

const LEAD_ROLES = [
  "coach",
  "team_coordinator",
  "fundraising_lead",
  "advocacy_lead",
] as const;

export function TeamMemberList({
  memberships,
}: {
  memberships: MembershipWithProfile[];
}) {
  const usersWithLeadRole = new Set(
    memberships
      .filter((m) => LEAD_ROLES.includes(m.role as (typeof LEAD_ROLES)[number]))
      .map((m) => m.user_id),
  );

  const generalMembers = memberships.filter(
    (m) => m.role === "member" && !usersWithLeadRole.has(m.user_id),
  );

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold uppercase">General Members</h2>
      <div className="mt-2">
        <Table>
          <caption className="sr-only">General Members</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pronouns</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generalMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No general members.
                </TableCell>
              </TableRow>
            ) : (
              generalMembers.map((m) => (
                <TableRow key={`${m.user_id}-${m.role}`}>
                  <TableCell className="font-medium">
                    {displayName(m.profiles)}
                  </TableCell>
                  <TableCell>{m.profiles?.pronouns ?? "—"}</TableCell>
                  <TableCell>{m.profiles?.email ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
