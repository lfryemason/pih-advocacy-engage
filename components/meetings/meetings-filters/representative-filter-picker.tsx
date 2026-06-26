"use client";

import { useMemo } from "react";
import { FilterCombobox, type ComboboxOption } from "@/components/ui/combobox";

export type RepRow = {
  id: string;
  official_full_name: string | null;
  state: string;
  district: number | null;
};

export function repLabel(rep: RepRow): string {
  const prefix = rep.district == null ? "Sen. " : "Rep. ";
  return `${prefix}${rep.official_full_name ?? "Unknown"} (${rep.state})`;
}

export function RepresentativeFilterPicker({
  selectedIds,
  reps,
  profileState,
  profileDistrict,
  onAdd,
  disabled,
}: {
  selectedIds: string[];
  reps: RepRow[];
  profileState: string | null;
  profileDistrict: string | null;
  onAdd: (repId: string) => void;
  disabled: boolean;
}) {
  const myRepIds = useMemo(
    () =>
      new Set(
        reps
          .filter((rep) => {
            if (!profileState || rep.state !== profileState) return false;
            if (rep.district === null) return true;
            if (!profileDistrict || profileDistrict === "at-large")
              return false;
            const distNum = parseInt(profileDistrict, 10);
            return !isNaN(distNum) && rep.district === distNum;
          })
          .map((rep) => rep.id),
      ),
    [reps, profileState, profileDistrict],
  );

  const options = useMemo<ComboboxOption[]>(
    () =>
      reps
        .filter((rep) => !selectedIds.includes(rep.id))
        .map((rep) => ({ id: rep.id, label: repLabel(rep) })),
    [reps, selectedIds],
  );

  return (
    <div className="w-56">
      <FilterCombobox
        id="rep-filter"
        options={options}
        priorityIds={myRepIds}
        priorityGroupLabel="My Representatives"
        value=""
        onChange={(repId) => {
          if (repId) onAdd(repId);
        }}
        placeholder="Representative"
        disabled={disabled}
        className={selectedIds.length > 0 ? "!bg-muted" : ""}
      />
    </div>
  );
}
