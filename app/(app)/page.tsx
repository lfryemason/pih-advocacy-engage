import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function HomeContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Homepage</h1>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
