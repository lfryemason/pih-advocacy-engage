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
import {
  displayName,
  LEAD_ROLES,
  type MembershipWithProfile,
} from "@/lib/teams";

export type { MembershipWithProfile };

export function TeamMemberList({
  memberships,
  meetingCounts = {},
}: {
  memberships: MembershipWithProfile[];
  meetingCounts?: Record<string, number>;
}) {
  const usersWithLeadRole = new Set(
    memberships
      .filter((m) => (LEAD_ROLES as readonly string[]).includes(m.role))
      .map((m) => m.user_id),
  );

  const generalMembers = memberships.filter(
    (m) => m.role === "member" && !usersWithLeadRole.has(m.user_id),
  );

  return (
    <div className="mt-8">
      <Table>
        <caption className="sr-only">General Members</caption>
        <TableHeader>
          <TableRow>
            <TableHead>General Members</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Meetings this year</TableHead>
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
