import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProfileRow = { first_name: string | null; last_name: string | null };

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  team_memberships: {
    role: string;
    profiles: ProfileRow | ProfileRow[] | null;
  }[];
};

function profileName(profiles: ProfileRow | ProfileRow[] | null): string {
  const p = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!p) return "—";
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
}

export async function RepTeamsSection({
  repState,
  chamber,
  district,
}: {
  repState: string;
  chamber: string;
  district: number | null;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("teams")
    .select(
      "id, name, slug, team_memberships(role, profiles(first_name, last_name))",
    )
    .eq("org_id", ORG_ID)
    .eq("state", repState)
    .order("name");

  if (chamber === "rep" && district !== null) {
    query = query.contains("congressional_districts", [String(district)]);
  }

  const { data: teams, error } = await query;

  if (error) {
    return (
      <p className="mt-2 text-sm text-destructive">
        Error loading teams: {error.message}
      </p>
    );
  }

  if (!teams || teams.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Teams</h2>
      <div className="mt-3 rounded-md border">
        <Table>
          <caption className="sr-only">
            Teams in contact with this representative
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Team Coordinator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(teams as TeamRow[]).map((team) => {
              const coordinators = team.team_memberships
                .filter((m) => m.role === "team_coordinator")
                .map((m) => profileName(m.profiles))
                .filter((n) => n !== "—");

              return (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/teams/${team.slug}`}
                      className="text-primary-dark hover:underline"
                    >
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {coordinators.length > 0 ? coordinators.join(", ") : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
