"use client";

import { useMemo } from "react";
import { FilterCombobox, type ComboboxOption } from "@/components/ui/combobox";
import type { DelegationMemberOption } from "@/lib/meetings/types";

export function DelegationMemberFilterPicker({
  selectedIds,
  members,
  onAdd,
  disabled,
}: {
  selectedIds: string[];
  members: DelegationMemberOption[];
  onAdd: (userId: string) => void;
  disabled: boolean;
}) {
  const options = useMemo<ComboboxOption[]>(
    () =>
      members
        .filter((member) => !selectedIds.includes(member.user_id))
        .map((member) => ({ id: member.user_id, label: member.display_name })),
    [members, selectedIds],
  );

  return (
    <div className="w-56">
      <FilterCombobox
        id="delegation-member-filter"
        options={options}
        value=""
        onChange={(userId) => {
          if (userId) onAdd(userId);
        }}
        placeholder="Delegation member"
        disabled={disabled}
        className={selectedIds.length > 0 ? "!bg-muted" : ""}
      />
    </div>
  );
}
