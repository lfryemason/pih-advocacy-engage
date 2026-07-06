import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";
import { requireGuest } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Sign Up" };

export default async function Page() {
  await requireGuest();
  return <SignUpForm />;
}
