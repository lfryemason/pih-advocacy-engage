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

function repName(rep: Representative, prefix: string): string {
  return `${prefix} ${rep.official_full_name ?? `${rep.first_name} ${rep.last_name}`}`;
}

function RepTable({
  title,
  members,
  prefix,
  stateLabel,
  renderLocation,
}: {
  title: string;
  members: Representative[];
  prefix: string;
  stateLabel: string;
  renderLocation: (rep: Representative) => string;
}) {
  if (members.length === 0) return null;

  return (
    <div className="w-full min-w-0 md:w-1/2">
      <h3 className="text-base font-medium">{title}</h3>
      <div className="mt-2">
        <Table aria-label={title}>
          <TableHeader className="[&_th]:text-secondary-magenta-foreground [&_tr]:bg-secondary-magenta [&_tr]:hover:bg-secondary-magenta">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="pr-4">{stateLabel}</TableHead>
              <TableHead>Party</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((rep) => (
              <TableRow key={rep.id}>
                <TableCell className="w-full max-w-0 truncate font-medium">
                  <Link
                    href={`/representatives/${rep.bioguide_id}`}
                    className="block truncate underline-offset-4 hover:underline"
                  >
                    {repName(rep, prefix)}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap pr-4">
                  {renderLocation(rep)}
                </TableCell>
                <TableCell>
                  <PartyBadge party={rep.party} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function TeamRepList({
  state,
  congressionalDistricts,
}: {
  state: string;
  congressionalDistricts: string[];
}) {
  const [open, setOpen] = useState(true);
  const [senators, setSenators] = useState<Representative[]>([]);
  const [houseMembers, setHouseMembers] = useState<Representative[]>([]);

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
    ]).then(([{ data: sens }, { data: house }]) => {
      setSenators(sens ?? []);
      setHouseMembers(house ?? []);
    });
  }, [state, congressionalDistricts]);

  if (senators.length === 0 && houseMembers.length === 0) return null;

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-lg font-semibold"
      >
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
        <span>Members of Congress</span>
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-8 md:flex-row">
          <RepTable
            title="Representatives"
            members={houseMembers}
            prefix="Rep."
            stateLabel="State / District"
            renderLocation={(rep) =>
              `${rep.state}/${rep.district === null ? "At-Large" : rep.district}`
            }
          />
          <RepTable
            title="Senators"
            members={senators}
            prefix="Sen."
            stateLabel="State"
            renderLocation={(rep) => rep.state}
          />
        </div>
      )}
    </section>
  );
}
