"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignUpOrClaimResult = { ok: true } | { ok: false; error: string };

/**
 * Public signup that also handles claiming a placeholder teammate account.
 *
 * Runs server-side so the placeholder lookup never reaches the client, and
 * every branch returns the same neutral success — the response must not
 * reveal whether an email already has an account (real or placeholder).
 *
 * Claiming is safe because the staged password is inert until the email is
 * confirmed: a no-password placeholder can't log in, and with email
 * confirmations enabled a freshly staged password can't be used either until
 * the confirmation link — delivered only to the real inbox — is clicked.
 * The user_id never changes, so team memberships and delegation assignments
 * carry over automatically.
 */
export async function signUpOrClaim(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pronouns: string;
  state: string;
  district: string;
}): Promise<SignUpOrClaimResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "Email and password are required." };
  }

  // Look up the email via the profiles table (service role). Auth emails are
  // stored lowercased, and handle_new_user copies them verbatim.
  const admin = createAdminClient();
  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("user_id, is_placeholder")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Real/claimed account (not a placeholder): neutral no-op so the response
  // never reveals the account exists.
  if (profile && !profile.is_placeholder) {
    return { ok: true };
  }

  const supabase = await createClient();

  if (profile?.is_placeholder) {
    const { data: userData } = await admin.auth.admin.getUserById(
      profile.user_id,
    );
    // Unclaimed placeholders are exactly the unconfirmed ones; anything else
    // falls through to the neutral response below.
    if (userData?.user && !userData.user.email_confirmed_at) {
      // Stage the password AND the claimer's own profile details (same
      // metadata shape as a fresh signup). Both stay inert until the email
      // is confirmed; the confirmation trigger then copies these details
      // over the placeholder's profile, so the claimer's spelling of their
      // name/pronouns wins over whatever the placeholder's creator entered.
      const { error: stageError } = await admin.auth.admin.updateUserById(
        profile.user_id,
        {
          password: input.password,
          user_metadata: {
            first_name: input.firstName,
            last_name: input.lastName,
            pronouns: input.pronouns,
            state: input.state,
            congressional_district: input.district || null,
            is_placeholder: true,
          },
        },
      );
      if (stageError) {
        // Password policy violations are about the caller's own input — safe
        // and useful to surface.
        return {
          ok: false,
          error:
            stageError.message || "Something went wrong. Please try again.",
        };
      }
      // Send the confirmation email (anon client; respects rate limits).
      await supabase.auth.resend({ type: "signup", email });
      return { ok: true };
    }
    return { ok: true };
  }

  // No profile — a normal signup. Supabase obfuscates signups against
  // existing confirmed auth users itself, so this branch stays neutral too.
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        pronouns: input.pronouns,
        state: input.state,
        congressional_district: input.district || null,
      },
    },
  });
  if (signUpError) {
    return { ok: false, error: signUpError.message };
  }
  return { ok: true };
}
