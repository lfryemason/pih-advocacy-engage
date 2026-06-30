"use client";

import { X } from "lucide-react";

export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function ActiveFilterChips({
  chips,
  disabled,
}: {
  chips: FilterChip[];
  disabled: boolean;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
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
  );
}
