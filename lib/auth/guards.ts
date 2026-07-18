import { redirect } from "next/navigation";
import { getCurrentRole, getCurrentUser, type CurrentRole } from "./role";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireRole(): Promise<CurrentRole> {
  const current = await getCurrentRole();
  if (!current) redirect("/auth/login");
  return current;
}

export async function requireSuperAdmin(): Promise<CurrentRole> {
  const current = await requireRole();
  if (current.role !== "super_admin") {
    throw new ForbiddenError("Super admin required");
  }
  return current;
}

export async function requireOrgAdmin(orgId: string): Promise<CurrentRole> {
  const current = await requireRole();
  if (current.role === "super_admin") return current;
  if (current.role !== "org_admin") {
    throw new ForbiddenError("Org admin required");
  }
  if (current.org_id !== orgId) {
    throw new ForbiddenError("Org admin of a different org");
  }
  return current;
}

export async function getIsAdmin(orgId: string): Promise<boolean> {
  const current = await getCurrentRole();
  if (!current) return false;
  if (current.role === "super_admin") return true;
  return current.role === "org_admin" && current.org_id === orgId;
}

export async function getIsFacilitator(orgId: string): Promise<boolean> {
  const current = await getCurrentRole();
  if (!current) return false;
  return current.role === "facilitator" && current.org_id === orgId;
}

/**
 * For auth pages that only make sense when logged out (login, sign-up,
 * forgot-password, etc).
 */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect("/");
}
