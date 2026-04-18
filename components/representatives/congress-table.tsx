"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { PartyBadge } from "@/components/representatives/party-badge";
import { Filters } from "@/components/representatives/representatives-filters";
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

export function CongressTable({ filters }: { filters: Filters }) {
  const [page, setPage] = useState(0);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    const supabase = createClient();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("representatives")
      .select("*", { count: "exact" })
      .eq("chamber", "rep")
      .eq("in_office", true);

    if (filters.states.length > 0) query = query.in("state", filters.states);
    if (filters.parties.length > 0) query = query.in("party", filters.parties);
    const name = filters.name.trim();
    if (name) {
      const escaped = name.replace(/[,()*]/g, " ");
      query = query.or(
        `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,official_full_name.ilike.%${escaped}%`,
      );
    }

    const response = query.order("state").order("district").range(from, to);

    response.then(({ data, count, error: queryError }) => {
      if (queryError) {
        setError(true);
      } else {
        setRepresentatives(data ?? []);
        setTotalPages(Math.ceil((count ?? 0) / PAGE_SIZE));
      }
      setIsLoading(false);
    });
  }, [page, filters]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <div className="w-full min-w-0 md:w-1/2">
      <h2 className="mb-3 text-2xl font-bold">Representatives</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-destructive">Failed to load representatives.</p>
      ) : representatives.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No representatives found.
        </p>
      ) : (
        <>
          <Table>
            <caption className="sr-only">Representatives</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">State</TableHead>
                <TableHead className="text-center">District</TableHead>
                <TableHead>Party</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {representatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="w-full max-w-0 truncate font-medium">
                    <Link
                      href={`/representatives/${rep.bioguide_id}`}
                      className="block truncate underline-offset-4 hover:underline"
                    >
                      {rep.official_full_name ??
                        `${rep.first_name} ${rep.last_name}`}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">{rep.state}</TableCell>
                  <TableCell className="text-center">{rep.district}</TableCell>
                  <TableCell>
                    <PartyBadge party={rep.party} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        </>
      )}
    </div>
  );
}
