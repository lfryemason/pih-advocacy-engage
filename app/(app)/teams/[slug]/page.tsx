import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { TeamPageClient } from "@/components/teams/team-page-client";
import type { MembershipWithProfile } from "@/components/teams/team-member-list";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";
import type { Tables } from "@/lib/supabase/database.types";

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

  const [{ data: team }, { data: authData }] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, name, slug, org_id, state, type, description, founded_date, congressional_districts, created_at, updated_at",
      )
      .eq("org_id", ORG_ID)
      .eq("slug", slug)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!team) redirect("/teams");

  const numericDistricts = team.congressional_districts
    .filter((d: string) => d !== "at-large")
    .map((d: string) => parseInt(d));
  const hasAtLarge = team.congressional_districts.includes("at-large");

  let repQuery = supabase
    .from("representatives")
    .select("*")
    .eq("chamber", "rep")
    .eq("state", team.state)
    .eq("in_office", true);

  if (hasAtLarge) {
    repQuery = repQuery.is("district", null);
  } else if (numericDistricts.length > 0) {
    repQuery = repQuery.in("district", numericDistricts);
  }

  const [{ data: senators }, { data: houseMembers }, { data: rawMemberships }] =
    await Promise.all([
      supabase
        .from("representatives")
        .select("*")
        .eq("chamber", "sen")
        .eq("state", team.state)
        .eq("in_office", true),
      team.congressional_districts.length > 0
        ? repQuery
        : Promise.resolve({ data: [] as Tables<"representatives">[] }),
      supabase
        .from("team_memberships")
        .select(
          "role, user_id, profiles(user_id, first_name, last_name, pronouns, email)",
        )
        .eq("team_id", team.id),
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

  const representatives: Tables<"representatives">[] = [
    ...(senators ?? []),
    ...(houseMembers ?? []),
  ];

  return (
    <TeamPageClient
      team={team}
      memberships={memberships}
      orgId={ORG_ID}
      currentUserId={authData.user?.id ?? null}
      representatives={representatives}
    />
  );
}
