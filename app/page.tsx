import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function AuthCheck() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <main />;
}

export default function Home() {
  return (
    <Suspense>
      <AuthCheck />
    </Suspense>
  );
}
