import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "./app-role";

export type { UserRole };

export type CurrentRole = {
  user_id: string;
  role: UserRole;
  org_id: string | null;
};

// Cached per-request so repeated calls (page + guards) don't each hit
// Supabase's Auth API and race on session refresh.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentRole = cache(async (): Promise<CurrentRole | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_role")
    .select("user_id, role, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { user_id: data.user_id, role: data.role, org_id: data.org_id };
});
