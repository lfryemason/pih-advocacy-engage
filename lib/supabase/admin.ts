import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role Supabase client. Bypasses RLS and can call the auth admin API.
 *
 * MUST only ever be imported from server code (server actions, route
 * handlers, server components) — never from a `"use client"` file. The
 * `server-only` import above makes a client-side import a build error.
 *
 * Don't put this client in a global; create it per call site (see
 * lib/supabase/server.ts for the same convention).
 */
export function createAdminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations. " +
        'Locally: eval "$(npx supabase status -o env)" or add it to .env.local.',
    );
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
