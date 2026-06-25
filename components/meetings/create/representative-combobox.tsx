"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { FilterCombobox, ComboboxOption } from "@/components/ui/combobox";

type RepRow = {
  id: string;
  official_full_name: string | null;
  state: string;
  district: number | null;
};

function repLabel(r: RepRow): string {
  const prefix = r.district == null ? "Sen. " : "Rep. ";
  return `${prefix}${r.official_full_name ?? "Unknown"} (${r.state})`;
}

export function RepresentativeCombobox({
  id,
  value,
  onChange,
  required,
}: {
  id: string;
  value: string;
  onChange: (repId: string) => void;
  required?: boolean;
}) {
  const [reps, setReps] = useState<RepRow[]>([]);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileDistrict, setProfileDistrict] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("representatives")
      .select("id, official_full_name, state, district")
      .eq("in_office", true)
      .order("state")
      .order("official_full_name")
      .then(({ data }) => setReps(data ?? []));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("state, congressional_district")
        .eq("user_id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.state) {
            setProfileState(profile.state);
            setProfileDistrict(profile.congressional_district);
          }
        });
    });
  }, []);

  const myRepIds = useMemo(
    () =>
      new Set(
        reps
          .filter((r) => {
            if (!profileState || r.state !== profileState) return false;
            if (r.district === null) return true;
            if (!profileDistrict || profileDistrict === "at-large")
              return false;
            const distNum = parseInt(profileDistrict, 10);
            return !isNaN(distNum) && r.district === distNum;
          })
          .map((r) => r.id),
      ),
    [reps, profileState, profileDistrict],
  );

  const options = useMemo<ComboboxOption[]>(
    () => reps.map((r) => ({ id: r.id, label: repLabel(r) })),
    [reps],
  );

  return (
    <FilterCombobox
      id={id}
      options={options}
      priorityIds={myRepIds}
      priorityGroupLabel="My Representatives"
      nonPriorityGroupLabel="Other Representatives"
      value={value}
      onChange={onChange}
      required={required}
    />
  );
}
