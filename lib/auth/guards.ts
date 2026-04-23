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

export async function requireOrgAdmin(): Promise<CurrentRole> {
  const current = await requireRole();
  if (current.role === "super_admin") return current;
  if (current.role !== "org_admin") {
    throw new ForbiddenError("Org admin required");
  }
  return current;
}
