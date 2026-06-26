"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import { xor } from "es-toolkit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";
import { PARTIES } from "@/lib/parties";
import { MeetingFilters } from "@/lib/meetings/types";
import {
  RepresentativeFilterPicker,
  type RepRow,
  repLabel,
} from "./meetings-filters/representative-filter-picker";
import { DateRangeFilter } from "./meetings-filters/date-range-filter";

export const EMPTY_MEETING_FILTERS: MeetingFilters = {
  states: [],
  districts: [],
  parties: [],
  representativeIds: [],
  dateRange: { from: null, to: null },
};

export function hasActiveMeetingFilters(f: MeetingFilters): boolean {
  return (
    f.states.length > 0 ||
    f.districts.length > 0 ||
    f.parties.length > 0 ||
    f.representativeIds.length > 0 ||
    f.dateRange.from !== null ||
    f.dateRange.to !== null
  );
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

  const [reps, setReps] = useState<RepRow[]>([]);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileDistrict, setProfileDistrict] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("representatives")
      .select("id, official_full_name, state, district")
      .eq("in_office", true)
      .order("state")
      .order("official_full_name")
      .then(({ data }) => setReps(data ?? []));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("state, congressional_district")
        .eq("user_id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.state) {
            setProfileState(profile.state);
            setProfileDistrict(profile.congressional_district);
          }
        });
    });
  }, []);

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

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.states.map((code) => ({
      key: `state-${code}`,
      label:
        US_STATES.find((stateEntry) => stateEntry.code === code)?.name ?? code,
      onRemove: () => {
        const newStates = filters.states.filter(
          (stateCode) => stateCode !== code,
        );
        const validValues = new Set(
          newStates.flatMap((stateCode) =>
            getDistrictOptions(stateCode).map((opt) => opt.value),
          ),
        );
        onChange({
          ...filters,
          states: newStates,
          districts: filters.districts.filter((districtCode) =>
            validValues.has(districtCode),
          ),
        });
      },
    })),
    ...filters.districts.map((district) => ({
      key: `district-${district}`,
      label:
        availableDistricts.find((opt) => opt.value === district)?.label ??
        district,
      onRemove: () =>
        set({
          districts: filters.districts.filter(
            (districtCode) => districtCode !== district,
          ),
        }),
    })),
    ...filters.parties.map((party) => ({
      key: `party-${party}`,
      label: party,
      onRemove: () =>
        set({
          parties: filters.parties.filter(
            (existingParty) => existingParty !== party,
          ),
        }),
    })),
    ...filters.representativeIds.map((repId) => ({
      key: `rep-${repId}`,
      label: (() => {
        const rep = reps.find((repEntry) => repEntry.id === repId);
        return rep ? repLabel(rep) : repId;
      })(),
      onRemove: () =>
        set({
          representativeIds: filters.representativeIds.filter(
            (id) => id !== repId,
          ),
        }),
    })),
  ];

  const hasActive = hasActiveMeetingFilters(filters);

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter
          dateRange={filters.dateRange}
          onChange={(range) => set({ dateRange: range })}
          disabled={disabled}
        />

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
                onSelect={(e) => {
                  e.preventDefault();
                  const newStates = xor(filters.states, [state.code]);
                  const validValues = new Set(
                    newStates.flatMap((stateCode) =>
                      getDistrictOptions(stateCode).map((opt) => opt.value),
                    ),
                  );
                  const newDistricts = filters.districts.filter(
                    (districtCode) => validValues.has(districtCode),
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
              variant="outline"
              size="sm"
              aria-label="Filter by party"
              className={`justify-between ${filters.parties.length > 0 ? "bg-muted" : ""}`}
              disabled={disabled}
            >
              <span className="mx-2 truncate">Party</span>
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

        <RepresentativeFilterPicker
          selectedIds={filters.representativeIds}
          reps={reps}
          profileState={profileState}
          profileDistrict={profileDistrict}
          onAdd={(repId) =>
            set({
              representativeIds: [...filters.representativeIds, repId],
            })
          }
          disabled={disabled}
        />

        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_MEETING_FILTERS)}
            disabled={disabled}
          >
            <X aria-hidden="true" />
            Clear all filters
          </Button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label} filter`}
                className="ml-1 rounded hover:text-destructive disabled:opacity-50"
                onClick={chip.onRemove}
                disabled={disabled}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
