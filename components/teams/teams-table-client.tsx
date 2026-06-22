"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TYPE_BADGE_CLASS } from "@/lib/teams";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TeamTableRow = {
  name: string;
  slug: string;
  type: string;
  typeLabel: string;
  state: string;
  leads: number;
  members: number;
};

export function TeamsTableClient({ teams }: { teams: TeamTableRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, search]);

  return (
    <div className="mt-6">
      <Input
        type="search"
        placeholder="Search Team"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search teams by name"
        className="max-w-xs"
      />
      <div className="mt-4">
        <Table>
          <caption className="sr-only">Teams</caption>
          <TableHeader className="[&_th]:text-primary-foreground [&_tr]:bg-primary [&_tr]:hover:bg-primary">
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Number of Leads</TableHead>
              <TableHead>Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No teams match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((team) => (
                <TableRow
                  key={team.slug}
                  className="cursor-pointer"
                  onClick={() => router.push(`/teams/${team.slug}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/teams/${team.slug}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={TYPE_BADGE_CLASS[team.type] ?? ""}
                    >
                      {team.typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>{team.state}</TableCell>
                  <TableCell>{team.leads}</TableCell>
                  <TableCell>{team.members}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
