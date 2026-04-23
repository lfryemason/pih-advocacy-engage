import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "./profile";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  return profile;
}

export async function requireSuperAdmin(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") {
    throw new ForbiddenError("Super admin required");
  }
  return profile;
}

export async function requireOrgAdmin(orgId?: string): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role === "super_admin") return profile;
  if (profile.role !== "org_admin") {
    throw new ForbiddenError("Org admin required");
  }
  if (orgId && profile.org_id !== orgId) {
    throw new ForbiddenError("Org admin of a different org");
  }
  return profile;
}
