import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { getCurrentRole } from "@/lib/auth/role";
import { TeamPageClient } from "@/components/teams/team-page-client";
import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("name")
    .eq("org_id", ORG_ID)
    .eq("slug", slug)
    .single();
  return { title: data?.name ?? "Team" };
}

export default function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <SuspenseWithDefaultFallback>
      <TeamContent params={params} />
    </SuspenseWithDefaultFallback>
  );
}

async function TeamContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: team }, { data: authData }, role] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, name, slug, org_id, state, type, description, founded_date, congressional_districts, created_at, updated_at",
      )
      .eq("org_id", ORG_ID)
      .eq("slug", slug)
      .single(),
    supabase.auth.getUser(),
    getCurrentRole(),
  ]);

  const isOrgAdmin =
    role?.role === "super_admin" ||
    (role?.role === "org_admin" && role.org_id === ORG_ID);

  if (!team) redirect("/teams");

  const { data: rawMemberships, error: membershipsError } = await supabase
    .from("team_memberships")
    .select(
      "role, user_id, profiles(user_id, first_name, last_name, pronouns, email)",
    )
    .eq("team_id", team.id);
  if (membershipsError) console.error(membershipsError);

  const memberships: MembershipWithProfile[] = (rawMemberships ?? []).map(
    (m) => ({
      role: m.role,
      user_id: m.user_id,
      profiles: Array.isArray(m.profiles)
        ? (m.profiles[0] ?? null)
        : m.profiles,
    }),
  );

  // Coaches are excluded from meeting counts, consistent with how they are
  // excluded from membership counts elsewhere.
  const userIds = memberships
    .filter((m) => m.role !== "coach")
    .map((m) => m.user_id);
  const meetingCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);

    const { data: delegationRows, error: delegationError } = await supabase
      .from("meeting_delegation_members")
      .select("user_id, meetings!inner(meeting_date)")
      .in("user_id", userIds)
      .gte("meetings.meeting_date", oneYearAgoStr)
      .lte("meetings.meeting_date", todayStr);
    if (delegationError) console.error(delegationError);

    for (const row of delegationRows ?? []) {
      meetingCounts[row.user_id] = (meetingCounts[row.user_id] ?? 0) + 1;
    }
  }

  return (
    <TeamPageClient
      team={team}
      memberships={memberships}
      orgId={ORG_ID}
      currentUserId={authData.user?.id ?? null}
      isOrgAdmin={isOrgAdmin}
      meetingCounts={meetingCounts}
    />
  );
}
