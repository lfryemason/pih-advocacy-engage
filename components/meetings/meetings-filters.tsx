"use client";

import { useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import { xor } from "es-toolkit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";
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
  disabled = false,
}: {
  filters: MeetingFilters;
  onChange: (f: MeetingFilters) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<MeetingFilters>) =>
    onChange({ ...filters, ...patch });
  const active = hasActiveMeetingFilters(filters);

  const availableDistricts = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const state of filters.states) {
      for (const opt of getDistrictOptions(state)) {
        if (!seen.has(opt.value)) {
          seen.add(opt.value);
          result.push(opt);
        }
      }
    }
    return result.sort((a, b) => {
      if (a.value === "at-large") return -1;
      if (b.value === "at-large") return 1;
      return Number(a.value) - Number(b.value);
    });
  }, [filters.states]);

  const stateLabel = summarize(
    filters.states,
    "State",
    (code) => US_STATES.find((s) => s.code === code)?.name ?? code,
    "states",
  );
  const districtLabel = summarize(
    filters.districts,
    "District",
    (d) => availableDistricts.find((o) => o.value === d)?.label ?? d,
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
            disabled={disabled}
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
                const newStates = xor(filters.states, [state.code]);
                const validValues = new Set(
                  newStates.flatMap((s) =>
                    getDistrictOptions(s).map((o) => o.value),
                  ),
                );
                const newDistricts = filters.districts.filter((d) =>
                  validValues.has(d),
                );
                onChange({
                  ...filters,
                  states: newStates,
                  districts: newDistricts,
                });
              }}
            >
              {state.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {filters.states.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.districts.length > 0 ? "default" : "outline"}
              size="sm"
              aria-label="Filter by district"
              className={`${FILTER_WIDTH} justify-between`}
              disabled={disabled}
            >
              <span className="truncate">{districtLabel}</span>
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 overflow-y-auto">
            {availableDistricts.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={filters.districts.includes(value)}
                onSelect={(e) => {
                  e.preventDefault();
                  set({ districts: xor(filters.districts, [value]) });
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.parties.length > 0 ? "default" : "outline"}
            size="sm"
            aria-label="Filter by party"
            className={`${FILTER_WIDTH} justify-between`}
            disabled={disabled}
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
          disabled={disabled}
        >
          <X aria-hidden="true" />
          Clear all
        </Button>
      )}
    </div>
  );
}
