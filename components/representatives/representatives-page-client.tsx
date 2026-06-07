"use client";

import { useState } from "react";
import { CongressTable } from "@/components/representatives/congress-table";
import { SenatorsTable } from "@/components/representatives/senators-table";
import { MyRepresentativesTable } from "@/components/representatives/my-representatives-table";
import {
  EMPTY_FILTERS,
  Filters,
  RepresentativesFilters,
} from "@/components/representatives/representatives-filters";

export function RepresentativesPageClient() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  return (
    <div className="flex flex-col p-8">
      <h1 className="mb-6 text-3xl font-bold">Members of Congress</h1>
      <div className="mb-8">
        <h2 className="mb-3 text-2xl font-bold">My Members of Congress</h2>
        <MyRepresentativesTable />
      </div>
      <h2 className="mb-3 text-2xl font-bold">Filter Members of Congress</h2>
      <RepresentativesFilters filters={filters} onChange={setFilters} />
      <div className="flex flex-col gap-8 md:flex-row">
        <SenatorsTable filters={filters} />
        <CongressTable filters={filters} />
      </div>
    </div>
  );
}
