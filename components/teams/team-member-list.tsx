"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadSection } from "@/components/teams/lead-section";

export type MembershipWithProfile = {
  role: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    pronouns: string | null;
    email: string;
  } | null;
};

const LEAD_ROLES = ["team_lead", "fundraising_lead", "advocacy_lead"] as const;

function displayName(profiles: MembershipWithProfile["profiles"]) {
  if (!profiles) return "—";
  return (
    [profiles.first_name, profiles.last_name].filter(Boolean).join(" ") || "—"
  );
}

export function TeamMemberList({
  memberships,
}: {
  memberships: MembershipWithProfile[];
}) {
  const byRole: Record<string, MembershipWithProfile[]> = {};
  for (const m of memberships) {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  }

  const usersWithLeadRole = new Set(
    memberships
      .filter((m) => LEAD_ROLES.includes(m.role as (typeof LEAD_ROLES)[number]))
      .map((m) => m.user_id),
  );

  const generalMembers = (byRole["member"] ?? []).filter(
    (m) => !usersWithLeadRole.has(m.user_id),
  );

  return (
    <div className="mt-8">
      <div className="flex justify-center">
        <LeadSection title="Team Lead" members={byRole["team_lead"] ?? []} />
      </div>

      <div className="mt-6 flex justify-center gap-16">
        <LeadSection
          title="Fundraising Lead"
          members={byRole["fundraising_lead"] ?? []}
        />
        <LeadSection
          title="Advocacy Lead"
          members={byRole["advocacy_lead"] ?? []}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold uppercase">General Members</h3>
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
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
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
    </div>
  );
}
