import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { TeamPageClient } from "@/components/teams/team-page-client";
import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";

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

  const [{ data: team }, { data: authData }] = await Promise.all([
    supabase
      .from("teams")
      .select()
      .eq("org_id", ORG_ID)
      .eq("slug", slug)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!team) {
    console.log("Team not found, redirecting to teams list page");
    redirect("/teams");
  }

  const { data: rawMemberships } = await supabase
    .from("team_memberships")
    .select("role, user_id")
    .eq("team_id", team.id);

  const userIds = [...new Set((rawMemberships ?? []).map((m) => m.user_id))];

  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, pronouns, email")
        .in("user_id", userIds)
    : { data: [] };

  const profileByUserId = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p]),
  );

  const memberships: MembershipWithProfile[] = (rawMemberships ?? []).map(
    (m) => ({
      role: m.role,
      user_id: m.user_id,
      profiles: profileByUserId[m.user_id] ?? null,
    }),
  );

  return (
    <TeamPageClient
      team={team}
      memberships={memberships}
      orgId={ORG_ID}
      currentUserId={authData.user?.id ?? null}
    />
  );
}
