import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["app_role"];

// super_admin is intentionally excluded: it's not assignable from the admin
// UI (org admins manage roles within their own org only; there's no UI path
// that should be able to grant cross-org super_admin access).
export type AssignableAppRole = Exclude<UserRole, "super_admin">;

export const APP_ROLE_LABELS: Record<AssignableAppRole, string> = {
  member: "User",
  facilitator: "Facilitator",
  org_admin: "Org Admin",
};

export const APP_ROLE_OPTIONS: { value: AssignableAppRole; label: string }[] = (
  Object.keys(APP_ROLE_LABELS) as AssignableAppRole[]
).map((role) => ({
  value: role,
  label: APP_ROLE_LABELS[role],
}));
