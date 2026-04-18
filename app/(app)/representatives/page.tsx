"use client";

import { useState } from "react";
import { CongressTable } from "@/components/representatives/congress-table";
import { SenatorsTable } from "@/components/representatives/senators-table";
import {
  EMPTY_FILTERS,
  Filters,
  RepresentativesFilters,
} from "@/components/representatives/representatives-filters";

export default function Representatives() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  return (
    <div className="flex flex-col p-8">
      <h1 className="mb-6 text-3xl font-bold">Representatives</h1>
      <RepresentativesFilters filters={filters} onChange={setFilters} />
      <div className="flex flex-col gap-8 md:flex-row">
        <SenatorsTable filters={filters} />
        <CongressTable filters={filters} />
      </div>
    </div>
  );
}
