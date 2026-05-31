"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
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

export function TeamRepList({
  state,
  congressionalDistricts,
}: {
  state: string;
  congressionalDistricts: string[];
}) {
  const [open, setOpen] = useState(true);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const numericDistricts = congressionalDistricts
      .filter((d) => d !== "at-large")
      .map((d) => parseInt(d));
    const hasAtLarge = congressionalDistricts.includes("at-large");

    let repQuery = supabase
      .from("representatives")
      .select("*")
      .eq("chamber", "rep")
      .eq("state", state)
      .eq("in_office", true);

    if (hasAtLarge) {
      repQuery = repQuery.is("district", null);
    } else if (numericDistricts.length > 0) {
      repQuery = repQuery.in("district", numericDistricts);
    }

    Promise.all([
      supabase
        .from("representatives")
        .select("*")
        .eq("chamber", "sen")
        .eq("state", state)
        .eq("in_office", true),
      congressionalDistricts.length > 0
        ? repQuery
        : Promise.resolve({ data: [] as Representative[] }),
    ]).then(([{ data: senators }, { data: houseMembers }]) => {
      setRepresentatives([...(senators ?? []), ...(houseMembers ?? [])]);
    });
  }, [state, congressionalDistricts]);

  if (representatives.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-lg font-semibold uppercase"
      >
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
        <span>Representatives</span>
      </button>
      {open && (
        <div className="mt-2">
          <Table aria-label="Representatives">
            <TableHeader className="[&_th]:text-white [&_tr]:bg-pink-600 [&_tr]:hover:bg-pink-600">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Chamber</TableHead>
                <TableHead className="text-center">State</TableHead>
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
        </div>
      )}
    </div>
  );
}
