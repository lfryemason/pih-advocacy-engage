"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMyTeamMembers } from "@/lib/meetings/queries";
import { UserSearchCombobox } from "@/components/profile-search/user-search-combobox";
import type { ProfileSearchResult, TeamGroup } from "@/lib/meetings/types";

export function AddExistingMemberSearch({
  excludedUserIds,
  onSelect,
}: {
  excludedUserIds: Set<string>;
  onSelect: (profile: ProfileSearchResult) => void;
}) {
  const [myTeamGroups, setMyTeamGroups] = useState<TeamGroup[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    fetchMyTeamMembers(supabaseRef.current)
      .then(setMyTeamGroups)
      .catch(() => {})
      .finally(() => setIsLoadingInitial(false));
  }, []);

  return (
    <div className="w-64">
      <UserSearchCombobox
        selectedProfile={null}
        onSelect={(profile) => {
          if (profile) onSelect(profile);
        }}
        excludedUserIds={excludedUserIds}
        supabase={supabaseRef.current}
        myTeamGroups={myTeamGroups}
        isLoadingInitial={isLoadingInitial}
        label="Search users to add to this team"
        placeholder="Add existing user"
        groupByTeam={false}
      />
    </div>
  );
}
