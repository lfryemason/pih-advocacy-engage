import { redirect } from "next/navigation";
import { getCurrentRole, type CurrentRole } from "./role";

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
