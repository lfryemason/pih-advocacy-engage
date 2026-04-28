"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORG_ID } from "@/lib/org";
import { TYPE_LABELS } from "@/components/teams/team-form";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
  type: string;
  team_memberships: { count: number }[];
};

export function TeamsTable() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("teams")
      .select("id, name, slug, state, type, team_memberships(count)")
      .eq("org_id", ORG_ID)
      .order("name")
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else {
          setTeams((data as TeamRow[]) ?? []);
        }
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  if (error) return <p className="mt-6 text-destructive">Error: {error}</p>;
  if (teams.length === 0)
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
          {teams.map((team) => (
            <TableRow
              key={team.id}
              className="cursor-pointer"
              onClick={() => router.push(`/teams/${team.slug}`)}
            >
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>{team.state}</TableCell>
              <TableCell>
                {TYPE_LABELS[team.type as keyof typeof TYPE_LABELS] ??
                  team.type}
              </TableCell>
              <TableCell>{team.team_memberships[0]?.count ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
