import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/teams/team-form";
import { ORG_ID } from "@/lib/org";

export default function NewTeamPage() {
  return (
    <div className="p-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/teams">← Teams</Link>
        </Button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Create a new team</h1>
      <TeamForm orgId={ORG_ID} />
    </div>
  );
}
