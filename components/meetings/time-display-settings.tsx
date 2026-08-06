"use client";

import { useId, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimeDisplayPreference } from "@/lib/meetings/time-preference";
import type { TimeDisplayPreference } from "@/lib/meetings/format";

const OPTIONS: { value: TimeDisplayPreference; label: string }[] = [
  { value: "current", label: "Current timezone" },
  { value: "eastern", label: "Eastern timezone" },
  { value: "specified", label: "User specified timezone" },
];

export function TimeDisplaySettings() {
  const { preference, setPreference, hasProvider } = useTimeDisplayPreference();
  const selectId = useId();
  const [open, setOpen] = useState(false);

  if (!hasProvider) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          aria-label="Time display settings"
          className="rounded-full border-none hover:border-none hover:bg-black/10 hover:text-inherit dark:hover:bg-white/15"
        >
          <Settings aria-hidden="true" className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-fit bg-background px-3 py-2 text-xs"
      >
        <Label htmlFor={selectId} className="mb-2">
          View times in:
        </Label>
        <Select
          id={selectId}
          className="h-7 py-0 pr-6 text-xs"
          value={preference}
          onChange={(e) => {
            setOpen(false);
            setPreference(e.target.value as TimeDisplayPreference);
          }}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </PopoverContent>
    </Popover>
  );
}
