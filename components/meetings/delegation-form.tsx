"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMyTeamMembers } from "@/lib/meetings/queries";
import { ROLE_LABELS, DELEGATION_ROLES } from "@/lib/meetings/meeting-roles";
import { SECTION_LABEL_CLASSNAME } from "@/lib/meetings/format";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type {
  DelegationMember,
  DelegationRole,
  LocalDelegationMember,
  ProfileSearchResult,
  ProfileTeam,
  TeamGroup,
} from "@/lib/meetings/types";
import { memberFromDelegation } from "@/lib/meetings/types";
import {
  PendingMemberRow,
  type PendingRow,
} from "@/components/meetings/pending-member-row";

function pendingToMember(row: PendingRow): LocalDelegationMember {
  const team = row.team ?? row.profile!.teams[0] ?? null;
  return {
    key: row.key,
    dbId: null,
    user_id: row.profile!.user_id,
    display_name: row.profile!.display_name,
    first_name: row.profile!.first_name ?? "",
    last_name: row.profile!.last_name ?? "",
    pronouns: row.profile!.pronouns,
    email: null,
    role: row.role,
    team_id: team?.team_id ?? null,
    team_name_snapshot: team?.team_name ?? null,
    display_teams: team
      ? [{ team_id: team.team_id, team_name: team.team_name }]
      : [],
  };
}

export function DelegationForm({
  initialMembers,
  onChange,
}: {
  initialMembers: DelegationMember[];
  onChange: (members: LocalDelegationMember[]) => void;
}) {
  const [members, setMembers] = useState<LocalDelegationMember[]>(() =>
    initialMembers.map(memberFromDelegation),
  );
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [newestPendingKey, setNewestPendingKey] = useState<string | null>(null);
  const [myTeamGroups, setMyTeamGroups] = useState<TeamGroup[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    fetchMyTeamMembers(supabaseRef.current)
      .then(setMyTeamGroups)
      .catch(() => {})
      .finally(() => setIsLoadingInitial(false));
  }, []);

  const allExcludedUserIds = useMemo(() => {
    const ids = new Set(members.map((member) => member.user_id));
    for (const row of pendingRows) {
      if (row.profile) ids.add(row.profile.user_id);
    }
    return ids;
  }, [members, pendingRows]);

  function notifyChange(
    nextMembers: LocalDelegationMember[],
    nextPending: PendingRow[],
  ) {
    const pendingMembers = nextPending
      .filter((row) => row.profile !== null)
      .map(pendingToMember);
    onChange([...nextMembers, ...pendingMembers]);
  }

  function updateMembers(next: LocalDelegationMember[]) {
    setMembers(next);
    notifyChange(next, pendingRows);
  }

  function handleRemove(key: string) {
    updateMembers(members.filter((member) => member.key !== key));
  }

  function handleRoleChange(key: string, role: DelegationRole) {
    updateMembers(
      members.map((member) =>
        member.key === key ? { ...member, role } : member,
      ),
    );
  }

  function addPendingRow() {
    const key = crypto.randomUUID();
    setPendingRows([
      ...pendingRows,
      {
        key,
        profile: null,
        team: undefined,
        role: "attendee" as DelegationRole,
      },
    ]);
    setNewestPendingKey(key);
  }

  function updatePendingRow(
    key: string,
    profile: ProfileSearchResult | null,
    team: ProfileTeam | undefined,
    role: DelegationRole,
  ) {
    const nextPending = pendingRows.map((row) =>
      row.key === key ? { ...row, profile, team, role } : row,
    );
    setPendingRows(nextPending);
    notifyChange(members, nextPending);
  }

  function removePendingRow(key: string) {
    const nextPending = pendingRows.filter((row) => row.key !== key);
    setPendingRows(nextPending);
    notifyChange(members, nextPending);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={SECTION_LABEL_CLASSNAME}>Delegation</p>

      {(members.length > 0 || pendingRows.length > 0) && (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.key}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              <AvatarInitialsCircle
                firstName={member.first_name}
                lastName={member.last_name}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{member.display_name}</p>
                {member.display_teams.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {member.display_teams
                      .map((team) => team.team_name)
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <Label
                  htmlFor={`role-${member.key}`}
                  className="sr-only"
                >{`Role for ${member.display_name}`}</Label>
                <Select
                  id={`role-${member.key}`}
                  aria-label={`Role for ${member.display_name}`}
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(
                      member.key,
                      e.target.value as DelegationRole,
                    )
                  }
                  className="text-xs"
                >
                  {DELEGATION_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Remove ${member.display_name}`}
                onClick={() => handleRemove(member.key)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          ))}

          {pendingRows.map((row) => (
            <PendingMemberRow
              key={row.key}
              row={row}
              focusOnMount={row.key === newestPendingKey}
              excludedUserIds={allExcludedUserIds}
              supabase={supabaseRef.current}
              myTeamGroups={myTeamGroups}
              isLoadingInitial={isLoadingInitial}
              onUpdate={updatePendingRow}
              onRemove={removePendingRow}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-center"
        onClick={addPendingRow}
      >
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
        Add member
      </Button>
    </div>
  );
}
