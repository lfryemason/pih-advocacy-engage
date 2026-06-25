"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { FilterCombobox, ComboboxOption } from "@/components/ui/combobox";

type TeamRow = { id: string; name: string };

export function TeamCombobox({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (teamId: string, teamName: string | null) => void;
}) {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("teams")
      .select("id, name")
      .order("name")
      .then(({ data }) => setTeams(data ?? []));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("team_memberships")
        .select("team_id")
        .eq("user_id", user.id)
        .then(({ data: memberships }) => {
          if (memberships) {
            setMyTeamIds(new Set(memberships.map((m) => m.team_id)));
          }
        });
    });
  }, []);

  const options = useMemo<ComboboxOption[]>(
    () => teams.map((t) => ({ id: t.id, label: t.name })),
    [teams],
  );

  function handleChange(teamId: string) {
    onChange(teamId, teams.find((t) => t.id === teamId)?.name ?? null);
  }

  return (
    <FilterCombobox
      id={id}
      options={options}
      priorityIds={myTeamIds}
      priorityGroupLabel="My Teams"
      nonPriorityGroupLabel="Other Teams"
      value={value}
      onChange={handleChange}
      placeholder="None"
      clearLabel="None"
    />
  );
}
