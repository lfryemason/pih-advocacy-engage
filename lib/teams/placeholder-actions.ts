"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth/role";
import { ORG_ID } from "@/lib/org";
import { validatePlaceholderFields } from "@/lib/teams/placeholder-validate";
import type { TeamRole } from "@/lib/teams";

export type PlaceholderActionResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Create a login-less placeholder auth user and add it to a team.
 *
 * Runs with the service role because RLS (correctly) forbids inserting a
 * team_memberships row for a user_id other than auth.uid(), and creating an
 * auth user requires the admin API. The caller must be a signed-in member of
 * the org.
 */
export async function createPlaceholderTeammate(input: {
  teamId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  pronouns?: string;
  state?: string;
  district?: string;
  role?: TeamRole;
}): Promise<PlaceholderActionResult> {
  const callerRole = await getCurrentRole();
  if (!callerRole || callerRole.org_id !== ORG_ID) {
    return { ok: false, error: "You must be an organization member." };
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName?.trim() ?? "";
  const lastName = input.lastName?.trim() ?? "";
  const pronouns = input.pronouns?.trim() ?? "";
  const state = input.state?.trim() ?? "";
  const district = input.district?.trim() ?? "";
  const role: TeamRole = input.role ?? "member";

  const validationError = validatePlaceholderFields(
    email,
    firstName,
    lastName,
    role,
  );
  if (validationError) return { ok: false, error: validationError };

  const isAdmin =
    callerRole.role === "org_admin" || callerRole.role === "super_admin";

  // Both checks run through the caller's RLS-scoped client (which blocks
  // cross-org teamIds) and are independent, so issue them together.
  const supabase = await createClient();
  const [{ data: team }, { data: callerMembership }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, slug")
      .eq("id", input.teamId)
      .eq("org_id", ORG_ID)
      .maybeSingle(),
    supabase
      .from("team_memberships")
      .select("team_id")
      .eq("team_id", input.teamId)
      .eq("user_id", callerRole.user_id)
      .limit(1)
      .maybeSingle(),
  ]);
  if (!team) return { ok: false, error: "Team not found." };
  // Org admins can add to any team; everyone else must be on it.
  if (!isAdmin && !callerMembership) {
    return {
      ok: false,
      error: "Only members of this team can add a teammate.",
    };
  }

  // No password and email_confirm: false — the user cannot log in. The
  // handle_new_user trigger creates the user_role + profiles rows and reads
  // is_placeholder from the metadata.
  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName || null,
        last_name: lastName || null,
        pronouns: pronouns || null,
        state: state || null,
        congressional_district: district || null,
        is_placeholder: true,
      },
    });
  if (createError || !created?.user) {
    // Don't leak whether the existing account is real or a placeholder.
    if (createError?.status === 422 || createError?.code === "email_exists") {
      return { ok: false, error: "Someone with this email already exists." };
    }
    return { ok: false, error: "Failed to create teammate." };
  }

  const userId = created.user.id;
  const { error: membershipError } = await admin
    .from("team_memberships")
    .insert({
      team_id: team.id,
      user_id: userId,
      org_id: ORG_ID,
      role,
    });
  if (membershipError) {
    // Best effort: don't leave an orphaned auth user behind.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return { ok: false, error: "Failed to add teammate to the team." };
  }

  revalidatePath(`/teams/${team.slug}`);
  return { ok: true, userId };
}

/**
 * Edit a placeholder's profile fields. Gated to is_placeholder = true — real
 * accounts can only be edited by their owners. Email is intentionally not
 * editable: the claim flow matches on the auth email (auth.users), so a
 * profiles-only email edit would silently break claiming.
 */
export async function updatePlaceholderTeammate(input: {
  userId: string;
  teamSlug: string;
  firstName?: string;
  lastName?: string;
  pronouns?: string;
  state?: string;
  district?: string;
}): Promise<PlaceholderActionResult> {
  const callerRole = await getCurrentRole();
  if (!callerRole || callerRole.org_id !== ORG_ID) {
    return { ok: false, error: "You must be an organization member." };
  }

  const firstName = input.firstName?.trim() ?? "";
  const lastName = input.lastName?.trim() ?? "";
  if (!firstName && !lastName) {
    return { ok: false, error: "A first or last name is required." };
  }

  // Same gate as creating a placeholder: org admins may edit any team's
  // placeholders; everyone else must be a member of the team.
  const isAdmin =
    callerRole.role === "org_admin" || callerRole.role === "super_admin";
  if (!isAdmin) {
    const supabase = await createClient();
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("slug", input.teamSlug)
      .eq("org_id", ORG_ID)
      .maybeSingle();
    if (!team) return { ok: false, error: "Team not found." };
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("team_id", team.id)
      .eq("user_id", callerRole.user_id)
      .limit(1)
      .maybeSingle();
    if (!membership) {
      return {
        ok: false,
        error: "Only members of this team can edit a teammate.",
      };
    }
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, is_placeholder, org_id")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!profile || profile.org_id !== ORG_ID || !profile.is_placeholder) {
    return { ok: false, error: "Only placeholder teammates can be edited." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      pronouns: input.pronouns?.trim() || null,
      state: input.state?.trim() || null,
      congressional_district: input.district?.trim() || null,
    })
    .eq("user_id", input.userId);
  if (updateError) {
    return { ok: false, error: "Failed to update teammate." };
  }

  revalidatePath(`/teams/${input.teamSlug}`);
  return { ok: true, userId: input.userId };
}

/**
 * Permanently delete a placeholder account (cascades its profile, team
 * memberships, and delegation rows). Irreversible — restricted to org admins
 * and gated to is_placeholder = true so a real account can never be deleted.
 */
export async function deletePlaceholderTeammate(input: {
  userId: string;
  teamSlug: string;
}): Promise<PlaceholderActionResult> {
  const callerRole = await getCurrentRole();
  const isOrgAdmin =
    callerRole?.role === "org_admin" && callerRole.org_id === ORG_ID;
  const isSuperAdmin = callerRole?.role === "super_admin";
  if (!isOrgAdmin && !isSuperAdmin) {
    return {
      ok: false,
      error: "Only organization admins can delete a placeholder.",
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, is_placeholder, org_id")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!profile || profile.org_id !== ORG_ID || !profile.is_placeholder) {
    return { ok: false, error: "Only placeholder teammates can be deleted." };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    input.userId,
  );
  if (deleteError) {
    return { ok: false, error: "Failed to delete placeholder." };
  }

  revalidatePath(`/teams/${input.teamSlug}`);
  return { ok: true, userId: input.userId };
}
