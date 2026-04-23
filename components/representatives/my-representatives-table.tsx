"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { PartyBadge } from "@/components/representatives/party-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Representative = Tables<"representatives">;

export function MyRepresentativesTable() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const meta = data?.user?.user_metadata ?? {};
      const state = String(meta.state ?? "");
      const district = String(meta.congressional_district ?? "");

      if (!state || !district) {
        setMissingProfile(true);
        setIsLoading(false);
        return;
      }

      const senQuery = supabase
        .from("representatives")
        .select("*")
        .eq("chamber", "sen")
        .eq("state", state)
        .eq("in_office", true);

      let repQuery = supabase
        .from("representatives")
        .select("*")
        .eq("chamber", "rep")
        .eq("state", state)
        .eq("in_office", true);

      if (district !== "at-large") {
        repQuery = repQuery.eq("district", parseInt(district));
      }

      const [
        { data: senators, error: senErr },
        { data: repData, error: repErr },
      ] = await Promise.all([senQuery, repQuery]);

      if (senErr || repErr) {
        setError(true);
      } else {
        setReps([...(senators ?? []), ...(repData ?? [])]);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  if (error)
    return (
      <p className="text-destructive">Failed to load your representatives.</p>
    );

  if (missingProfile)
    return (
      <p className="text-muted-foreground">
        Set your state and district in your{" "}
        <Link href="/profile" className="underline underline-offset-4">
          profile
        </Link>{" "}
        to see your representatives.
      </p>
    );

  if (reps.length === 0)
    return (
      <p className="text-muted-foreground">
        No representatives found for your district.
      </p>
    );

  return (
    <Table>
      <caption className="sr-only">My Representatives</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Chamber</TableHead>
          <TableHead className="text-center">State</TableHead>
          <TableHead>Party</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reps.map((rep) => (
          <TableRow key={rep.id}>
            <TableCell className="w-full max-w-0 truncate font-medium">
              <Link
                href={`/representatives/${rep.bioguide_id}`}
                className="block truncate underline-offset-4 hover:underline"
              >
                {rep.official_full_name ?? `${rep.first_name} ${rep.last_name}`}
              </Link>
            </TableCell>
            <TableCell>
              {rep.chamber === "sen" ? "Senator" : "Representative"}
            </TableCell>
            <TableCell className="text-center">{rep.state}</TableCell>
            <TableCell>
              <PartyBadge party={rep.party} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
