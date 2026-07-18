import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/role";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";
import { BetaBanner } from "@/components/homepage/beta-banner";
import { ResourceLinks } from "@/components/homepage/resource-links";

export const metadata: Metadata = { title: "Home" };

async function HomeContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <section aria-labelledby="welcome-heading">
          <h1 id="welcome-heading" className="text-3xl font-bold">
            Welcome to PIH Engage&apos;s advocacy tracking dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A platform for Partners in Health Engage advocates to coordinate
            congressional meetings, track advocacy efforts, and organize with
            other PIHE teams across the country.
          </p>
        </section>
        <BetaBanner />
        <ResourceLinks />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SuspenseWithDefaultFallback>
      <HomeContent />
    </SuspenseWithDefaultFallback>
  );
}
