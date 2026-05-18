import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORG_ID } from "@/lib/org";
import { TYPE_LABELS } from "@/lib/teams";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
  type: string;
  team_memberships: { role: string }[];
};

export async function TeamsTable() {
  const supabase = await createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, slug, state, type, team_memberships(role)")
    .eq("org_id", ORG_ID)
    .order("name");

  if (error)
    return <p className="mt-6 text-destructive">Error: {error.message}</p>;
  if (!teams?.length)
    return <p className="mt-6 text-muted-foreground">No teams yet.</p>;

  return (
    <div className="mt-6">
      <Table>
        <caption className="sr-only">Teams</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Members</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(teams as TeamRow[]).map((team) => (
            <TableRow key={team.id} className="relative">
              <TableCell className="font-medium">
                <Link
                  href={`/teams/${team.slug}`}
                  className="after:absolute after:inset-0"
                >
                  {team.name}
                </Link>
              </TableCell>
              <TableCell>{team.state}</TableCell>
              <TableCell>
                {TYPE_LABELS[team.type as keyof typeof TYPE_LABELS] ??
                  team.type}
              </TableCell>
              <TableCell>
                {team.team_memberships.filter((m) => m.role !== "coach").length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
