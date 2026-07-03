import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth/role";
import { ORG_ID } from "@/lib/org";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EditTeamForm } from "@/components/teams/edit-team-form";
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
  return { title: data ? `Edit ${data.name}` : "Edit team" };
}

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
      "id, name, slug, org_id, state, type, description, founded_date, congressional_districts, created_at, updated_at",
    )
    .eq("org_id", ORG_ID)
    .eq("slug", slug)
    .single();

  if (!team) redirect("/teams");

  const [{ data: rawMemberships }, currentRole] = await Promise.all([
    supabase
      .from("team_memberships")
      .select(
        "role, user_id, profiles(user_id, first_name, last_name, pronouns, email, is_placeholder)",
      )
      .eq("team_id", team.id),
    getCurrentRole(),
  ]);

  const memberships: MembershipWithProfile[] = (rawMemberships ?? []).map(
    (m) => ({
      role: m.role,
      user_id: m.user_id,
      profiles: Array.isArray(m.profiles)
        ? (m.profiles[0] ?? null)
        : m.profiles,
    }),
  );

  // Mirrors the "org admins delete teams" RLS policy; non-admin members can
  // edit but not delete, so the delete control stays hidden for them.
  const canDeleteTeam =
    currentRole?.role === "super_admin" ||
    (currentRole?.role === "org_admin" && currentRole.org_id === ORG_ID);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/teams/${slug}`}>{team.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mt-4 text-2xl font-bold">{team.name}</h1>
      <div className="mt-6">
        <EditTeamForm
          team={team}
          canDelete={canDeleteTeam}
          memberships={memberships}
          currentRole={currentRole}
        />
      </div>
    </>
  );
}
