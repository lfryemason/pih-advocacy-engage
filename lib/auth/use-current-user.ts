"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ORG_ID } from "@/lib/org";

export type CurrentUser = {
  userId: string | null;
  isAdmin: boolean;
};

const ANONYMOUS: CurrentUser = { userId: null, isAdmin: false };

// A user's id and role don't change between renders, so cache the lookup for
// the session and let every meeting row share it instead of refetching on each
// mount. Only successful lookups are cached so a transient failure can retry.
let cached: Promise<CurrentUser> | null = null;

async function fetchCurrentUser(): Promise<CurrentUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ANONYMOUS;

  const { data } = await supabase
    .from("user_role")
    .select("role, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin =
    !!data &&
    (data.role === "super_admin" ||
      (data.role === "org_admin" && data.org_id === ORG_ID));

  return { userId: user.id, isAdmin };
}

export function useCurrentUser(): CurrentUser {
  const [current, setCurrent] = useState<CurrentUser>(ANONYMOUS);

  useEffect(() => {
    let active = true;
    if (!cached) {
      cached = fetchCurrentUser().catch((err) => {
        cached = null; // allow a later mount to retry
        throw err;
      });
    }
    cached
      .then((value) => {
        if (active) setCurrent(value);
      })
      .catch(() => {
        if (active) setCurrent(ANONYMOUS);
      });
    return () => {
      active = false;
    };
  }, []);

  return current;
}
