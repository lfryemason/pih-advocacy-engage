import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth/role";
import type { AssignableAppRole } from "@/lib/auth/app-role";
import {
  UsersTableClient,
  type AdminUserRow,
} from "@/components/admin/users-table-client";

export async function UsersList() {
  const supabase = await createClient();

  const [
    currentUser,
    { data: profiles, error },
    { data: memberships },
    { data: teams },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email, is_placeholder")
      .eq("org_id", ORG_ID)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("team_memberships")
      .select("user_id, teams(name, slug)")
      .eq("org_id", ORG_ID),
    supabase
      .from("teams")
      .select("name, slug")
      .eq("org_id", ORG_ID)
      .order("name"),
    supabase.from("user_role").select("user_id, role").eq("org_id", ORG_ID),
  ]);

  if (error)
    return <p className="mt-6 text-destructive">Error: {error.message}</p>;
  if (rolesError)
    return <p className="mt-6 text-destructive">Error: {rolesError.message}</p>;
  if (!profiles?.length)
    return <p className="mt-6 text-muted-foreground">No users found.</p>;

  const roleByUser = new Map<string, AssignableAppRole>();
  for (const role of roles ?? []) {
    if (role.role === "super_admin") continue;
    roleByUser.set(role.user_id, role.role);
  }

  const teamsByUser = new Map<string, { name: string; slug: string }[]>();
  for (const membership of memberships ?? []) {
    const raw = membership.teams as
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
    if (!raw) continue;
    const team = Array.isArray(raw) ? raw[0] : raw;
    if (!team) continue;
    const userTeams = teamsByUser.get(membership.user_id) ?? [];
    userTeams.push({ name: team.name, slug: team.slug });
    teamsByUser.set(membership.user_id, userTeams);
  }

  const userRows: AdminUserRow[] = profiles.map((profile) => ({
    user_id: profile.user_id,
    fullName:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      "(no name)",
    email: profile.email,
    role: roleByUser.get(profile.user_id) ?? "member",
    isPending: profile.is_placeholder,
    teams: teamsByUser.get(profile.user_id) ?? [],
  }));

  return (
    <UsersTableClient
      users={userRows}
      currentUserId={currentUser?.id ?? null}
      allTeams={(teams ?? []).map((team) => ({
        name: team.name,
        slug: team.slug,
      }))}
    />
  );
}
