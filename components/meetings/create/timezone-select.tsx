"use client";

import { useTimezoneSelect } from "react-timezone-select";
import { Select } from "@/components/ui/select";

export function TimezoneSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (tz: string) => void;
}) {
  const { options } = useTimezoneSelect({});

  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((tz) => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </Select>
  );
}
