import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { requireGuest } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function Page() {
  await requireGuest();
  return <ForgotPasswordForm />;
}
