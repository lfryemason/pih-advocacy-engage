"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// Placeholder suggestions — replace with the actual set of buildings to offer.
const SUGGESTED_BUILDINGS = [
  "Cannon Building (House)",
  "Rayburn Building (House)",
  "Longworth Building (House)",
  "Russell Building (Senate)",
  "Dirksen Building (Senate)",
  "Hart Building (Senate)",
];

const OTHER = "__other__";

export function BuildingSelect({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [otherSelected, setOtherSelected] = useState(
    () => value !== "" && !SUGGESTED_BUILDINGS.includes(value),
  );
  const otherInputRef = useRef<HTMLInputElement>(null);
  const focusOtherInputRef = useRef(false);

  useEffect(() => {
    if (otherSelected && focusOtherInputRef.current) {
      otherInputRef.current?.focus();
      focusOtherInputRef.current = false;
    }
  }, [otherSelected]);

  return (
    <div className="flex flex-col gap-2">
      <Select
        id={id}
        value={otherSelected ? OTHER : value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === OTHER) {
            setOtherSelected(true);
            onChange("");
            focusOtherInputRef.current = true;
            return;
          }
          setOtherSelected(false);
          onChange(next);
        }}
      >
        {value === "" && !otherSelected && <option value="">—</option>}
        {SUGGESTED_BUILDINGS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
        <option value={OTHER}>Other</option>
      </Select>

      {otherSelected && (
        <Input
          ref={otherInputRef}
          id={`${id}-other`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
