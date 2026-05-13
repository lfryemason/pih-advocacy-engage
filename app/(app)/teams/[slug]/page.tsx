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
      .select(
        "id, name, slug, org_id, state, type, description, founded_date, created_at, updated_at",
      )
      .eq("org_id", ORG_ID)
      .eq("slug", slug)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!team) redirect("/teams");

  const { data: rawMemberships } = await supabase
    .from("team_memberships")
    .select(
      "role, user_id, profiles(user_id, first_name, last_name, pronouns, email)",
    )
    .eq("team_id", team.id);

  const memberships: MembershipWithProfile[] = (rawMemberships ?? []).map(
    (m) => ({
      role: m.role,
      user_id: m.user_id,
      profiles: Array.isArray(m.profiles)
        ? (m.profiles[0] ?? null)
        : m.profiles,
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
