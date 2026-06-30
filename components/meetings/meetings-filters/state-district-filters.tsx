"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { xor } from "es-toolkit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";
import { MeetingFilters } from "@/lib/meetings/types";

export function validDistrictsForStates(states: string[]): Set<string> {
  return new Set(
    states.flatMap((stateCode) =>
      getDistrictOptions(stateCode).map((opt) => opt.value),
    ),
  );
}

export function availableDistrictsForStates(
  states: string[],
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const result: { value: string; label: string }[] = [];
  for (const state of states) {
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
}

export function StateDistrictFilters({
  filters,
  onChange,
  disabled,
}: {
  filters: MeetingFilters;
  onChange: (filters: MeetingFilters) => void;
  disabled: boolean;
}) {
  const availableDistricts = useMemo(
    () => availableDistrictsForStates(filters.states),
    [filters.states],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Filter by state"
            className={`justify-between ${filters.states.length > 0 ? "bg-muted" : ""}`}
            disabled={disabled}
          >
            <span className="mx-2 truncate">State</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 overflow-y-auto">
          {US_STATES.map((state) => (
            <DropdownMenuCheckboxItem
              key={state.code}
              checked={filters.states.includes(state.code)}
              onSelect={(event) => {
                event.preventDefault();
                const newStates = xor(filters.states, [state.code]);
                const validValues = validDistrictsForStates(newStates);
                onChange({
                  ...filters,
                  states: newStates,
                  districts: filters.districts.filter((districtCode) =>
                    validValues.has(districtCode),
                  ),
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
              variant="outline"
              size="sm"
              aria-label="Filter by district"
              className={`justify-between ${filters.districts.length > 0 ? "bg-muted" : ""}`}
              disabled={disabled}
            >
              <span className="mx-2 truncate">District</span>
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 overflow-y-auto">
            {availableDistricts.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={filters.districts.includes(value)}
                onSelect={(event) => {
                  event.preventDefault();
                  onChange({
                    ...filters,
                    districts: xor(filters.districts, [value]),
                  });
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
