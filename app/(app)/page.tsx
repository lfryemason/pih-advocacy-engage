import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";

export const metadata: Metadata = { title: "Home" };

async function HomeContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <h1 className="text-2xl font-bold">Homepage</h1>;
}

export default function Home() {
  return (
    <SuspenseWithDefaultFallback>
      <HomeContent />
    </SuspenseWithDefaultFallback>
  );
}
