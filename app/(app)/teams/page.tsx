import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TeamsTable } from "@/components/teams/teams-table";

export default function TeamsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Button asChild>
          <Link href="/teams/new">Create team</Link>
        </Button>
      </div>
      <TeamsTable />
    </div>
  );
}
