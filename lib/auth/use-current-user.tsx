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
};

const CurrentUserContext = createContext<CurrentUser | null>(null);

// Lets a server component (e.g. the app layout) resolve the current user once
// and share it with every client component below, instead of each one doing
// its own Supabase round trip. `userId`/`isAdmin` come from a server-side
// lookup, so they're already known on first client render — no loading flash.
export function CurrentUserProvider({
  userId,
  isAdmin,
  children,
}: {
  userId: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ userId, isAdmin }), [userId, isAdmin]);
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

// Resolves the signed-in user and whether they're an admin so the UI can gate
// privileged actions (e.g. deleting a meeting, viewing meeting details). When
// rendered under CurrentUserProvider, this reads the shared value the layout
// already resolved server-side. Otherwise (e.g. a component rendered outside
// the app layout, or in tests without the provider) it falls back to its own
// client-side lookup, starting from the null/false default until that
// resolves.
export function useCurrentUser(): CurrentUser {
  const context = useContext(CurrentUserContext);
  const [fetched, setFetched] = useState<CurrentUser>({
    userId: null,
    isAdmin: false,
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

        if (active) setFetched({ userId: user.id, isAdmin });
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
