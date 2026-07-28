"use client";

import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS, DELEGATION_ROLES } from "@/lib/meetings/meeting-roles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserSearchCombobox } from "@/components/profile-search/user-search-combobox";
import { Trash2 } from "lucide-react";
import type {
  DelegationRole,
  ProfileSearchResult,
  ProfileTeam,
  TeamGroup,
} from "@/lib/meetings/types";

type SupabaseClient = ReturnType<typeof createClient>;

export type PendingRow = {
  key: string;
  profile: ProfileSearchResult | null;
  team: ProfileTeam | undefined;
  role: DelegationRole;
};

export function PendingMemberRow({
  row,
  focusOnMount,
  excludedUserIds,
  supabase,
  myTeamGroups,
  isLoadingInitial,
  onUpdate,
  onRemove,
}: {
  row: PendingRow;
  focusOnMount?: boolean;
  excludedUserIds: Set<string>;
  supabase: SupabaseClient;
  myTeamGroups: TeamGroup[];
  isLoadingInitial: boolean;
  onUpdate: (
    key: string,
    profile: ProfileSearchResult | null,
    team: ProfileTeam | undefined,
    role: DelegationRole,
  ) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed p-2">
      <UserSearchCombobox
        selectedProfile={row.profile}
        onSelect={(profile, team) => onUpdate(row.key, profile, team, row.role)}
        excludedUserIds={excludedUserIds}
        supabase={supabase}
        myTeamGroups={myTeamGroups}
        isLoadingInitial={isLoadingInitial}
        focusOnMount={focusOnMount}
      />

      <Label htmlFor={`pending-role-${row.key}`} className="sr-only">
        Role for new member
      </Label>
      <Select
        id={`pending-role-${row.key}`}
        value={row.role}
        onChange={(e) =>
          onUpdate(
            row.key,
            row.profile,
            row.team,
            e.target.value as DelegationRole,
          )
        }
        className="shrink-0 cursor-pointer text-xs"
      >
        {DELEGATION_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Remove new member row"
        onClick={() => onRemove(row.key)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
