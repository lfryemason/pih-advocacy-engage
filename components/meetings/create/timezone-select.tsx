"use client";

import { useTimezoneSelect } from "react-timezone-select";
import { Select } from "@/components/ui/select";

// react-timezone-select keys Eastern Time under "America/Detroit".
const EASTERN_TIME = "America/Detroit";

export function TimezoneSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (tz: string) => void;
}) {
  const { options, parseTimezone } = useTimezoneSelect({});

  // A raw IANA zone (e.g. the browser's resolved timezone like
  // "America/New_York") often isn't one of the curated option values, which
  // would leave the <select> showing its first option (GMT-11). parseTimezone
  // fuzzy-matches it to a real option; fall back to Eastern when it can't.
  const parsed = parseTimezone(value);
  const selectedValue =
    parsed && typeof parsed === "object" ? parsed.value : EASTERN_TIME;

  return (
    <Select
      id={id}
      value={selectedValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((tz) => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </Select>
  );
}
