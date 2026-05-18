import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = { title: "Sign Up" };

export default function Page() {
  return <SignUpForm />;
}
