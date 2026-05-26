"use client";

import { ChevronDown, X } from "lucide-react";
import { xor } from "es-toolkit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { US_STATES } from "@/lib/us-districts";
import { PARTIES } from "@/lib/parties";
import { MeetingFilters } from "@/lib/meetings/types";

export const EMPTY_MEETING_FILTERS: MeetingFilters = {
  states: [],
  districts: [],
  parties: [],
};

export function hasActiveMeetingFilters(f: MeetingFilters): boolean {
  return f.states.length > 0 || f.districts.length > 0 || f.parties.length > 0;
}

const DISTRICTS = Array.from({ length: 52 }, (_, i) => String(i + 1));

const FILTER_WIDTH = "w-40";

function summarize(
  values: string[],
  emptyLabel: string,
  renderOne: (v: string) => string,
  pluralLabel: string,
): string {
  if (values.length === 0) return emptyLabel;
  if (values.length === 1) return renderOne(values[0]);
  return `${values.length} ${pluralLabel}`;
}

export function MeetingsFilters({
  filters,
  onChange,
}: {
  filters: MeetingFilters;
  onChange: (f: MeetingFilters) => void;
}) {
  const set = (patch: Partial<MeetingFilters>) =>
    onChange({ ...filters, ...patch });
  const active = hasActiveMeetingFilters(filters);

  const stateLabel = summarize(
    filters.states,
    "State",
    (code) => US_STATES.find((s) => s.code === code)?.name ?? code,
    "states",
  );
  const districtLabel = summarize(
    filters.districts,
    "District",
    (d) => `District ${d}`,
    "districts",
  );
  const partyLabel = summarize(filters.parties, "Party", (p) => p, "parties");

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.states.length > 0 ? "default" : "outline"}
            size="sm"
            aria-label="Filter by state"
            className={`${FILTER_WIDTH} justify-between`}
          >
            <span className="truncate">{stateLabel}</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 overflow-y-auto">
          {US_STATES.map((state) => (
            <DropdownMenuCheckboxItem
              key={state.code}
              checked={filters.states.includes(state.code)}
              onSelect={(e) => {
                e.preventDefault();
                set({ states: xor(filters.states, [state.code]) });
              }}
            >
              {state.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.districts.length > 0 ? "default" : "outline"}
            size="sm"
            aria-label="Filter by district"
            className={`${FILTER_WIDTH} justify-between`}
          >
            <span className="truncate">{districtLabel}</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 overflow-y-auto">
          {DISTRICTS.map((d) => (
            <DropdownMenuCheckboxItem
              key={d}
              checked={filters.districts.includes(d)}
              onSelect={(e) => {
                e.preventDefault();
                set({ districts: xor(filters.districts, [d]) });
              }}
            >
              District {d}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.parties.length > 0 ? "default" : "outline"}
            size="sm"
            aria-label="Filter by party"
            className={`${FILTER_WIDTH} justify-between`}
          >
            <span className="truncate">{partyLabel}</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PARTIES.map((party) => (
            <DropdownMenuCheckboxItem
              key={party}
              checked={filters.parties.includes(party)}
              onSelect={(e) => {
                e.preventDefault();
                set({ parties: xor(filters.parties, [party]) });
              }}
            >
              {party}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {active && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(EMPTY_MEETING_FILTERS)}
        >
          <X aria-hidden="true" />
          Clear all
        </Button>
      )}
    </div>
  );
}
