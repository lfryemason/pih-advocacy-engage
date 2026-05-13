import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/teams/team-form";
import { MemberEditTable } from "@/components/teams/member-edit-table";
import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";

export default function EditTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <SuspenseWithDefaultFallback>
      <EditTeamContent params={params} />
    </SuspenseWithDefaultFallback>
  );
}

async function EditTeamContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "id, name, slug, org_id, state, type, description, founded_date, created_at, updated_at",
    )
    .eq("org_id", ORG_ID)
    .eq("slug", slug)
    .single();

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
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={`/teams/${slug}`}>← {team.name}</Link>
        </Button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">{team.name}</h1>
      <TeamForm orgId={ORG_ID} team={team} />
      <MemberEditTable memberships={memberships} teamId={team.id} />
    </>
  );
}
