"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  representatives,
}: {
  representatives: Representative[];
}) {
  const [open, setOpen] = useState(false);

  if (representatives.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-lg font-semibold uppercase"
      >
        <span>Representatives</span>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="mt-2">
          <Table>
            <caption className="sr-only">Representatives</caption>
            <TableHeader>
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
