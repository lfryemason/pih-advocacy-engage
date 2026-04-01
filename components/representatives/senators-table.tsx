"use client";

import { useState } from "react";
import { Tables } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Representative = Tables<"representatives">;

const PAGE_SIZE = 50;

const partyColor: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Republican: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Independent:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function SenatorsTable({ senators }: { senators: Representative[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(senators.length / PAGE_SIZE);
  const paginated = senators.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (senators.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No senators found.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Party</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((senator) => (
              <TableRow key={senator.id}>
                <TableCell className="font-medium">
                  {senator.official_full_name ??
                    `${senator.first_name} ${senator.last_name}`}
                </TableCell>
                <TableCell>{senator.state}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={partyColor[senator.party] ?? ""}
                  >
                    {senator.party[0]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
