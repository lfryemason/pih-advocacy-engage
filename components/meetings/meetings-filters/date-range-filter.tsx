"use client";

import { useState } from "react";
import { X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function SingleDatePicker({
  label,
  ariaLabel,
  value,
  onChange,
  disabled,
  showIcon = true,
}: {
  label: string;
  ariaLabel: string;
  value: string | null;
  onChange: (date: string | null) => void;
  disabled: boolean;
  showIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  function handleSelect(day: Date | undefined) {
    onChange(day ? format(day, "yyyy-MM-dd") : null);
    setOpen(false);
  }

  const buttonLabel = value ? format(selected!, "MMM d, yyyy") : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`flex w-36 items-center ${value ? "bg-muted" : ""}`}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            className="flex flex-1 items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">
              {showIcon && !value && (
                <CalendarIcon
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <span
                className={`truncate ${value ? "" : "text-muted-foreground"}`}
              >
                {buttonLabel}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()} date`}
            className="mr-2 shrink-0 rounded hover:text-destructive"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

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
        label="After"
        ariaLabel="Filter after date"
        value={dateRange.from}
        onChange={(date) => onChange({ ...dateRange, from: date })}
        disabled={disabled}
      />
      <div className="w-px self-stretch bg-border" aria-hidden="true" />
      <SingleDatePicker
        label="Before"
        ariaLabel="Filter before date"
        value={dateRange.to}
        onChange={(date) => onChange({ ...dateRange, to: date })}
        disabled={disabled}
        showIcon={false}
      />
    </div>
  );
}
