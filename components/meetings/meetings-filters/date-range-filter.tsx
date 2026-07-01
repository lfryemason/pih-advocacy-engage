"use client";

import { SingleDatePicker } from "./single-date-picker";

export function DateRangeFilter({
  dateRange,
  onChange,
  disabled,
}: {
  dateRange: { from: string | null; to: string | null };
  onChange: (range: { from: string | null; to: string | null }) => void;
  disabled: boolean;
}) {
  return (
    <div className="inline-flex h-8 items-stretch overflow-hidden rounded-md border border-input bg-background text-sm shadow-sm">
      <SingleDatePicker
        label="From"
        ariaLabel="Filter from"
        value={dateRange.from}
        onChange={(date) => onChange({ ...dateRange, from: date })}
        disabled={disabled}
      />
      <div className="w-px self-stretch bg-border" aria-hidden="true" />
      <SingleDatePicker
        label="To"
        ariaLabel="Filter to"
        value={dateRange.to}
        onChange={(date) => onChange({ ...dateRange, to: date })}
        disabled={disabled}
        showIcon={false}
      />
    </div>
  );
}
