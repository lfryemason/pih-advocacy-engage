"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";
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
import { NameWithPronouns } from "@/components/teams/name-with-pronouns";
import { PendingBadge } from "@/components/teams/pending-badge";

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
      .filter((m) => LEAD_ROLES.includes(m.role as (typeof LEAD_ROLES)[number]))
      .map((m) => m.user_id),
  );

  const generalMembers = memberships.filter(
    (m) => m.role === "member" && !usersWithLeadRole.has(m.user_id),
  );

  const [open, setOpen] = useState(true);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-lg font-semibold"
      >
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
        <span>General Members</span>
      </button>
      {open && (
        <div className="mt-2">
          <Table>
            <caption className="sr-only">General Members</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Meetings in Last Year</TableHead>
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
                      <NameWithPronouns
                        name={displayName(m.profiles)}
                        pronouns={m.profiles?.pronouns}
                      />
                      {m.profiles?.is_placeholder && <PendingBadge />}
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
      )}
    </section>
  );
}
