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
    .select()
    .eq("org_id", ORG_ID)
    .eq("slug", slug)
    .single();

  if (!team) redirect("/teams");

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
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={`/teams/${slug}`}>← {team.name}</Link>
        </Button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">{team.name}</h1>
      <TeamForm orgId={ORG_ID} team={team} />
      <MemberEditTable
        memberships={memberships}
        teamId={team.id}
        orgId={ORG_ID}
      />
    </>
  );
}
