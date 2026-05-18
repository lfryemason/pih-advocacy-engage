import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["app_role"];

export type CurrentRole = {
  user_id: string;
  role: UserRole;
  org_id: string | null;
};

export const getCurrentRole = cache(async (): Promise<CurrentRole | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_role")
    .select("user_id, role, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { user_id: data.user_id, role: data.role, org_id: data.org_id };
});
