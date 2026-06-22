"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

// An invisible, non-focusable link that fills its (relatively positioned) cell
// so the whole row is clickable with a real anchor. Anchoring to the cell — not
// the row — is deliberate: Safari/WebKit doesn't treat a `<tr>` as a containing
// block for absolutely positioned children, so `inset-0` on a `<tr>` escapes the
// row. Cells position correctly across browsers. `aria-hidden` + `tabIndex={-1}`
// keep it out of the accessibility tree and tab order, so screen readers and
// keyboard users see exactly one link per row (the team name in the first cell).
function RowLinkOverlay({ href }: { href: string }) {
  return (
    <Link href={href} aria-hidden tabIndex={-1} className="absolute inset-0" />
  );
}

export function TeamsTableClient({ teams }: { teams: TeamTableRow[] }) {
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
              filtered.map((team) => {
                const href = `/teams/${team.slug}`;
                return (
                  <TableRow key={team.slug}>
                    <TableCell className="relative font-medium">
                      <Link
                        href={href}
                        className="after:absolute after:inset-0"
                      >
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell className="relative">
                      <Badge
                        variant="outline"
                        className={TYPE_BADGE_CLASS[team.type] ?? ""}
                      >
                        {team.typeLabel}
                      </Badge>
                      <RowLinkOverlay href={href} />
                    </TableCell>
                    <TableCell className="relative">
                      {team.state}
                      <RowLinkOverlay href={href} />
                    </TableCell>
                    <TableCell className="relative">
                      {team.leads}
                      <RowLinkOverlay href={href} />
                    </TableCell>
                    <TableCell className="relative">
                      {team.members}
                      <RowLinkOverlay href={href} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
