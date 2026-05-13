import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/teams/team-form";
import { ORG_ID } from "@/lib/org";

export const metadata: Metadata = { title: "Create a new team" };

export default function NewTeamPage() {
  return (
    <div className="p-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/teams" aria-label="Back to Teams">
            <span aria-hidden="true">← </span>Teams
          </Link>
        </Button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Create a new team</h1>
      <TeamForm orgId={ORG_ID} />
    </div>
  );
}
