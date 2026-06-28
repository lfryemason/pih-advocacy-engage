"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignUpOrClaimResult = { ok: true } | { ok: false; error: string };

/**
 * Public signup that also claims a placeholder teammate account when the email
 * matches one. Runs server-side and returns the same neutral success on every
 * branch so the response never reveals whether an account already exists.
 *
 * Claiming is safe because the staged password stays inert until the email is
 * confirmed via the link sent to the real inbox; the user_id never changes, so
 * memberships and delegations carry over.
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

  const admin = createAdminClient();
  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("user_id, is_placeholder")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Neutral no-op for a real account, so the response never reveals it exists.
  if (profile && !profile.is_placeholder) {
    return { ok: true };
  }

  const supabase = await createClient();

  if (profile?.is_placeholder) {
    const { data: userData } = await admin.auth.admin.getUserById(
      profile.user_id,
    );
    // Unclaimed placeholders are exactly the unconfirmed ones.
    if (userData?.user && !userData.user.email_confirmed_at) {
      // Stage the password and the claimer's profile details; both stay inert
      // until the confirmation trigger applies them over the placeholder.
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
        // The caller's own password failing policy is safe to surface.
        return {
          ok: false,
          error:
            stageError.message || "Something went wrong. Please try again.",
        };
      }
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) {
        // Keep the response neutral: surfacing this would reveal the
        // placeholder exists. Log it so a delivery failure is still visible.
        console.error(
          "Failed to send placeholder confirmation email",
          resendError,
        );
      }
      return { ok: true };
    }
    return { ok: true };
  }

  // No profile — a normal signup; Supabase keeps this neutral against existing
  // confirmed users on its own.
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
