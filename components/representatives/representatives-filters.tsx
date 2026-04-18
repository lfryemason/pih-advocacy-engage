"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { US_STATES, StateCode } from "@/lib/us-districts";
import { PARTIES, Party } from "@/lib/parties";

export interface Filters {
  states: StateCode[];
  parties: Party[];
  name: string;
}

export const EMPTY_FILTERS: Filters = { states: [], parties: [], name: "" };

export function hasActiveFilters(f: Filters): boolean {
  return f.states.length > 0 || f.parties.length > 0 || f.name.trim() !== "";
}

const FILTER_WIDTH = "w-40";
const NAME_DEBOUNCE_MS = 300;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function summarize(
  values: string[],
  emptyLabel: string,
  renderOne: (value: string) => string,
  pluralLabel: string,
): string {
  if (values.length === 0) return emptyLabel;
  if (values.length === 1) return renderOne(values[0]);
  return `${values.length} ${pluralLabel}`;
}

export function RepresentativesFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active = hasActiveFilters(filters);

  const stateLabel = summarize(
    filters.states,
    "State",
    (code) => US_STATES.find((s) => s.code === code)?.name ?? code,
    "states",
  );
  const partyLabel = summarize(filters.parties, "Party", (p) => p, "parties");

  const [nameDraft, setNameDraft] = useState(filters.name);

  useEffect(() => {
    setNameDraft(filters.name);
  }, [filters.name]);

  useEffect(() => {
    if (nameDraft === filters.name) return;
    const id = setTimeout(() => {
      onChange({ ...filters, name: nameDraft });
    }, NAME_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [nameDraft, filters, onChange]);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.states.length > 0 ? "default" : "outline"}
            size="sm"
            aria-label="Filter by state"
            className={`${FILTER_WIDTH} justify-between`}
          >
            <span className="truncate">{stateLabel}</span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64">
          {US_STATES.map((state) => {
            const checked = filters.states.includes(state.code);
            return (
              <DropdownMenuItem
                key={state.code}
                onSelect={(e) => {
                  e.preventDefault();
                  set({ states: toggle(filters.states, state.code) });
                }}
                className="pr-2"
              >
                <span className="mr-2 flex h-4 w-4 items-center justify-center">
                  {checked && <Check className="h-4 w-4" />}
                </span>
                {state.name}
              </DropdownMenuItem>
            );
          })}
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
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PARTIES.map((party) => {
            const checked = filters.parties.includes(party);
            return (
              <DropdownMenuItem
                key={party}
                onSelect={(e) => {
                  e.preventDefault();
                  set({ parties: toggle(filters.parties, party) });
                }}
                className="pr-2"
              >
                <span className="mr-2 flex h-4 w-4 items-center justify-center">
                  {checked && <Check className="h-4 w-4" />}
                </span>
                {party}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        placeholder="Name"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        aria-label="Filter by name"
        className={`h-8 ${FILTER_WIDTH}`}
      />

      {active && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X />
          Clear all
        </Button>
      )}
    </div>
  );
}
