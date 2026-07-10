import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function Page() {
  return <LoginForm />;
}
