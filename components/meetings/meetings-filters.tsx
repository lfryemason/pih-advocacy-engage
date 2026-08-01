"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { xor } from "es-toolkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/lib/us-districts";
import { PARTIES } from "@/lib/parties";
import { MeetingFilters } from "@/lib/meetings/types";
import {
  RepresentativeFilterPicker,
  type RepRow,
  repLabel,
} from "./meetings-filters/representative-filter-picker";
import { DateRangeFilter } from "./meetings-filters/date-range-filter";
import {
  StateDistrictFilters,
  validDistrictsForStates,
  availableDistrictsForStates,
} from "./meetings-filters/state-district-filters";
import {
  ActiveFilterChips,
  type FilterChip,
} from "./meetings-filters/active-filter-chips";
import { useMeetingBuildings } from "@/lib/meetings/use-meeting-buildings";

export const EMPTY_MEETING_FILTERS: MeetingFilters = {
  states: [],
  districts: [],
  parties: [],
  representativeIds: [],
  dateRange: { from: null, to: null },
  buildings: [],
  isVirtual: null,
};

export function hasActiveMeetingFilters(f: MeetingFilters): boolean {
  return (
    f.states.length > 0 ||
    f.districts.length > 0 ||
    f.parties.length > 0 ||
    f.representativeIds.length > 0 ||
    f.dateRange.from !== null ||
    f.dateRange.to !== null ||
    f.buildings.length > 0 ||
    f.isVirtual !== null
  );
}

const VIRTUAL_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "Virtual" },
  { value: false, label: "In person" },
];

function buildActiveChips(
  filters: MeetingFilters,
  reps: RepRow[] | null,
  onChange: (filters: MeetingFilters) => void,
): FilterChip[] {
  const availableDistricts = availableDistrictsForStates(filters.states);

  const stateChips: FilterChip[] = filters.states.map((code) => ({
    key: `state-${code}`,
    label:
      US_STATES.find((stateEntry) => stateEntry.code === code)?.name ?? code,
    onRemove: () => {
      const newStates = filters.states.filter(
        (stateCode) => stateCode !== code,
      );
      const validValues = validDistrictsForStates(newStates);
      onChange({
        ...filters,
        states: newStates,
        districts: filters.districts.filter((districtCode) =>
          validValues.has(districtCode),
        ),
      });
    },
  }));

  const districtChips: FilterChip[] = filters.districts.map((district) => ({
    key: `district-${district}`,
    label:
      availableDistricts.find((opt) => opt.value === district)?.label ??
      district,
    onRemove: () =>
      onChange({
        ...filters,
        districts: filters.districts.filter((code) => code !== district),
      }),
  }));

  const partyChips: FilterChip[] = filters.parties.map((party) => ({
    key: `party-${party}`,
    label: party,
    onRemove: () =>
      onChange({
        ...filters,
        parties: filters.parties.filter((existing) => existing !== party),
      }),
  }));

  const repChips: FilterChip[] = filters.representativeIds.map((repId) => {
    const rep = reps?.find((repEntry) => repEntry.id === repId);
    return {
      key: `rep-${repId}`,
      label: rep ? repLabel(rep) : reps === null ? "Loading…" : repId,
      onRemove: () =>
        onChange({
          ...filters,
          representativeIds: filters.representativeIds.filter(
            (id) => id !== repId,
          ),
        }),
    };
  });

  const buildingChips: FilterChip[] = filters.buildings.map((building) => ({
    key: `building-${building}`,
    label: building,
    onRemove: () =>
      onChange({
        ...filters,
        buildings: filters.buildings.filter(
          (existing) => existing !== building,
        ),
      }),
  }));

  const virtualChips: FilterChip[] =
    filters.isVirtual === null
      ? []
      : [
          {
            key: "format",
            label: VIRTUAL_OPTIONS.find(
              (opt) => opt.value === filters.isVirtual,
            )!.label,
            onRemove: () => onChange({ ...filters, isVirtual: null }),
          },
        ];

  return [
    ...stateChips,
    ...districtChips,
    ...partyChips,
    ...repChips,
    ...buildingChips,
    ...virtualChips,
  ];
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
  const buildings = useMeetingBuildings();

  const [reps, setReps] = useState<RepRow[] | null>(null);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileDistrict, setProfileDistrict] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("representatives")
      .select("id, official_full_name, state, district")
      .eq("in_office", true)
      .order("state")
      .order("official_full_name")
      .then(({ data }) => {
        if (!cancelled) setReps(data ?? []);
      });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      supabase
        .from("profiles")
        .select("state, congressional_district")
        .eq("user_id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (!cancelled && profile?.state) {
            setProfileState(profile.state);
            setProfileDistrict(profile.congressional_district);
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const chips = buildActiveChips(filters, reps, onChange);

  return (
    <Card className="mb-6 bg-background">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2 text-left"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn("transition-transform", !open && "-rotate-90")}
            />
            <span className="flex items-center gap-2 font-semibold">
              Filters
              {hasActiveMeetingFilters(filters) && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-secondary-foreground">
                  {chips.length}
                </span>
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeFilter
                dateRange={filters.dateRange}
                onChange={(range) => set({ dateRange: range })}
                disabled={disabled}
              />

              <StateDistrictFilters
                filters={filters}
                onChange={onChange}
                disabled={disabled}
              />

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
                      onSelect={(event) => {
                        event.preventDefault();
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
                reps={reps ?? []}
                profileState={profileState}
                profileDistrict={profileDistrict}
                onAdd={(repId) =>
                  set({
                    representativeIds: [...filters.representativeIds, repId],
                  })
                }
                disabled={disabled}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Filter by building"
                    className={`justify-between ${filters.buildings.length > 0 ? "bg-muted" : ""}`}
                    disabled={disabled}
                  >
                    <span className="mx-2 truncate">Building</span>
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {buildings.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No buildings yet
                    </div>
                  ) : (
                    buildings.map((building) => (
                      <DropdownMenuCheckboxItem
                        key={building}
                        checked={filters.buildings.includes(building)}
                        onSelect={(event) => {
                          event.preventDefault();
                          set({
                            buildings: xor(filters.buildings, [building]),
                          });
                        }}
                      >
                        {building}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Filter by meeting format"
                    className={`justify-between ${filters.isVirtual !== null ? "bg-muted" : ""}`}
                    disabled={disabled}
                  >
                    <span className="mx-2 truncate">Format</span>
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {VIRTUAL_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.label}
                      checked={filters.isVirtual === opt.value}
                      onSelect={(event) => {
                        event.preventDefault();
                        set({
                          isVirtual:
                            filters.isVirtual === opt.value ? null : opt.value,
                        });
                      }}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveMeetingFilters(filters) && (
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

            <ActiveFilterChips chips={chips} disabled={disabled} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
