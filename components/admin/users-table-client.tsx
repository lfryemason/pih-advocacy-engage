"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterCombobox } from "@/components/ui/combobox";
import { PendingBadge } from "@/components/teams/pending-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUserRow = {
  user_id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  isPending: boolean;
  teams: { name: string; slug: string }[];
};

const PAGE_SIZE = 25;
const NO_TEAM_VALUE = "__no_team__";

export function UsersTableClient({
  users,
  allTeams,
}: {
  users: AdminUserRow[];
  allTeams: { name: string; slug: string }[];
}) {
  const [nameSearch, setNameSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = nameSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (query && !user.fullName.toLowerCase().includes(query)) return false;
      if (teamFilter === NO_TEAM_VALUE) return user.teams.length === 0;
      if (teamFilter !== "")
        return user.teams.some((team) => team.slug === teamFilter);
      return true;
    });
  }, [users, nameSearch, teamFilter]);

  useEffect(() => {
    setPage(1);
  }, [nameSearch, teamFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="mt-2 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="name-search">Name</Label>
          <Input
            id="name-search"
            type="search"
            placeholder="Search by name"
            value={nameSearch}
            onChange={(event) => setNameSearch(event.target.value)}
            className="w-64"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="team-filter">Team</Label>
          <div className="w-56">
            <FilterCombobox
              id="team-filter"
              options={[
                { id: NO_TEAM_VALUE, label: "No team" },
                ...allTeams.map((team) => ({
                  id: team.slug,
                  label: team.name,
                })),
              ]}
              value={teamFilter}
              onChange={setTeamFilter}
              clearLabel="All teams"
              placeholder="All teams"
            />
          </div>
        </div>
      </div>

      <Table>
        <caption className="sr-only">Users</caption>
        <TableHeader className="[&_th]:text-primary-foreground [&_tr]:bg-primary [&_tr]:hover:bg-primary">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teams</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                No users match your filters.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {user.fullName}
                    {user.isAdmin && (
                      <>
                        <ShieldUser
                          size={14}
                          aria-hidden="true"
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="sr-only">(admin)</span>
                      </>
                    )}
                    {user.isPending && <PendingBadge />}
                  </span>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.teams.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {user.teams.map((team) => (
                        <Link
                          key={team.slug}
                          href={`/teams/${team.slug}`}
                          className="text-sm underline"
                        >
                          {team.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "0 users"
            : `${start}–${end} of ${filtered.length} user${filtered.length === 1 ? "" : "s"}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
