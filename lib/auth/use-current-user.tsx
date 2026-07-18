"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { ORG_ID } from "@/lib/org";

export type CurrentUser = {
  userId: string | null;
  isAdmin: boolean;
  isFacilitator: boolean;
};

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  userId,
  isAdmin,
  isFacilitator,
  children,
}: {
  userId: string;
  isAdmin: boolean;
  isFacilitator: boolean;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ userId, isAdmin, isFacilitator }),
    [userId, isAdmin, isFacilitator],
  );
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

// Resolves the signed-in user and whether they're an admin/facilitator so the
// UI can gate privileged actions (e.g. deleting a meeting, viewing meeting
// details).
export function useCurrentUser(): CurrentUser {
  const context = useContext(CurrentUserContext);
  const [fetched, setFetched] = useState<CurrentUser>({
    userId: null,
    isAdmin: false,
    isFacilitator: false,
  });

  useEffect(() => {
    if (context !== null) return;
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
        const isFacilitator =
          !!data && data.role === "facilitator" && data.org_id === ORG_ID;

        if (active) setFetched({ userId: user.id, isAdmin, isFacilitator });
      } catch {
        // Leave the default so privileged actions stay hidden if the lookup fails.
      }
    })();

    return () => {
      active = false;
    };
  }, [context]);

  return context ?? fetched;
}
