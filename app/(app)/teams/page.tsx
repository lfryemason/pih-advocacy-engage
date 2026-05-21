import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { TeamsTable } from "@/components/teams/teams-table";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Button asChild>
          <Link href="/teams/new">Create team</Link>
        </Button>
      </div>
      <Suspense
        fallback={<p className="mt-6 text-muted-foreground">Loading…</p>}
      >
        <TeamsTable />
      </Suspense>
    </div>
  );
}
