"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ORG_ID } from "@/lib/org";

export type CurrentUser = {
  userId: string | null;
  isAdmin: boolean;
};

// Resolves the signed-in user and whether they're an admin so the UI can gate
// privileged actions (e.g. deleting a meeting). Middleware redirects anyone not
// signed in to /auth/login, so a rendered page always has a user; the null
// default just covers the first render before this lookup resolves.
export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>({
    userId: null,
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("user_role")
          .select("role, org_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const isAdmin =
          !!data &&
          (data.role === "super_admin" ||
            (data.role === "org_admin" && data.org_id === ORG_ID));

        if (active) setUser({ userId: user.id, isAdmin });
      } catch {
        // Leave the default so privileged actions stay hidden if the lookup fails.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return user;
}
