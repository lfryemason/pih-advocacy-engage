import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type CurrentProfile = {
  user_id: string;
  role: UserRole;
  org_id: string | null;
  org_slug: string | null;
};

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_profiles")
      .select("user_id, role, org_id, organizations(slug)")
      .eq("user_id", user.id)
      .single<{
        user_id: string;
        role: UserRole;
        org_id: string | null;
        organizations: { slug: string } | null;
      }>();

    if (!data) return null;

    return {
      user_id: data.user_id,
      role: data.role,
      org_id: data.org_id,
      org_slug: data.organizations?.slug ?? null,
    };
  },
);
