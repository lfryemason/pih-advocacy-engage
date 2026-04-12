"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

const PAGE_SIZE = 25;

const partyColor: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Republican: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Independent:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function SenatorsTable() {
  const [page, setPage] = useState(0);
  const [senators, setSenators] = useState<Representative[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    const supabase = createClient();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const response = supabase
      .from("representatives")
      .select("*", { count: "exact" })
      .eq("chamber", "sen")
      .eq("in_office", true)
      .order("state")
      .order("last_name")
      .range(from, to);

    response.then(({ data, count, error: queryError }) => {
      if (queryError) {
        setError(true);
      } else {
        setSenators(data ?? []);
        setTotalPages(Math.ceil((count ?? 0) / PAGE_SIZE));
      }
      setIsLoading(false);
    });
  }, [page]);

  if (isLoading) {
    // TODO(lfm): Could be nice to change this to a better table loading state.
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return <p className="text-destructive">Failed to load senators.</p>;
  }

  if (senators.length === 0 && page === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No senators found.
      </p>
    );
  }

  return (
    <div className="max-w-[50%]">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Name</TableHead>
              <TableHead className="text-primary-foreground">State</TableHead>
              <TableHead className="text-primary-foreground">Party</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {senators.map((senator) => (
              <TableRow key={senator.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/representatives/${senator.bioguide_id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {senator.official_full_name ??
                      `${senator.first_name} ${senator.last_name}`}
                  </Link>
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
