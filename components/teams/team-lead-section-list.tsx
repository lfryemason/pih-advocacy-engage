"use client";

import { LeadSection } from "@/components/teams/lead-section";
import type { MembershipWithProfile } from "@/lib/teams";

export function TeamLeadSectionList({
  memberships,
}: {
  memberships: MembershipWithProfile[];
}) {
  const byRole: Record<string, MembershipWithProfile[]> = {};
  for (const m of memberships) {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  }

  return (
    <div className="mt-8">
      <div className="flex justify-center">
        <LeadSection title="Coach" members={byRole["coach"] ?? []} />
      </div>
      <div className="mt-6 flex justify-center">
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
    </div>
  );
}
