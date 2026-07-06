import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { requireGuest } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Sign In" };

export default async function Page() {
  await requireGuest();
  return <LoginForm />;
}
