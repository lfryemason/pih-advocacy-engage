"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { searchProfiles } from "@/lib/meetings/queries";
import { ROLE_LABELS } from "@/lib/meetings/meeting-roles";
import { SECTION_LABEL_CLASSNAME } from "@/lib/meetings/format";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type {
  DelegationMember,
  DelegationRole,
  LocalDelegationMember,
  ProfileSearchResult,
  ProfileTeam,
} from "@/lib/meetings/types";

function deriveRepresentedTeams(members: LocalDelegationMember[]): string[] {
  return [
    ...new Set(
      members
        .map((m) => m.team_name_snapshot)
        .filter((n): n is string => !!n && n.trim() !== ""),
    ),
  ];
}

function memberFromDelegation(m: DelegationMember): LocalDelegationMember {
  return {
    key: m.id,
    dbId: m.id,
    user_id: m.user_id,
    display_name: m.display_name,
    first_name: m.first_name,
    last_name: m.last_name,
    email: m.email,
    role: m.role,
    team_id: m.team_id,
    team_name_snapshot: m.team_name_snapshot,
  };
}

const DELEGATION_ROLES = Object.keys(ROLE_LABELS) as DelegationRole[];

type PendingProfile = {
  profile: ProfileSearchResult;
  role: DelegationRole;
  selectedTeam: ProfileTeam | null;
};

export function DelegationForm({
  meetingId,
  initialMembers,
  onChange,
}: {
  meetingId: string;
  initialMembers: DelegationMember[];
  onChange: (members: LocalDelegationMember[]) => void;
}) {
  const [members, setMembers] = useState<LocalDelegationMember[]>(() =>
    initialMembers.map(memberFromDelegation),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [pending, setPending] = useState<PendingProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingUserIds = new Set(members.map((m) => m.user_id));

  const runSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const supabase = createClient();
      searchProfiles(supabase, q)
        .then((results) => {
          setSearchResults(
            results.filter((r) => !existingUserIds.has(r.user_id)),
          );
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, runSearch]);

  function updateMembers(next: LocalDelegationMember[]) {
    setMembers(next);
    onChange(next);
  }

  function handleRemove(key: string) {
    updateMembers(members.filter((m) => m.key !== key));
  }

  function handleRoleChange(key: string, role: DelegationRole) {
    updateMembers(members.map((m) => (m.key === key ? { ...m, role } : m)));
  }

  function handleSelectProfile(profile: ProfileSearchResult) {
    const firstTeam = profile.teams[0] ?? null;
    setPending({
      profile,
      role: "attendee_listening",
      selectedTeam: firstTeam,
    });
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleAddPending() {
    if (!pending) return;
    const newMember: LocalDelegationMember = {
      key: crypto.randomUUID(),
      dbId: null,
      user_id: pending.profile.user_id,
      display_name: pending.profile.display_name,
      first_name: pending.profile.display_name.split(" ")[0] ?? "",
      last_name:
        pending.profile.display_name.split(" ").slice(1).join(" ") ?? "",
      email: null,
      role: pending.role,
      team_id: pending.selectedTeam?.team_id ?? null,
      team_name_snapshot: pending.selectedTeam?.team_name ?? null,
    };
    updateMembers([...members, newMember]);
    setPending(null);
  }

  function handleCancelPending() {
    setPending(null);
  }

  const representedTeams = deriveRepresentedTeams(members);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={SECTION_LABEL_CLASSNAME}>Delegation</p>

        {members.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.key}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                <AvatarInitialsCircle
                  firstName={m.first_name}
                  lastName={m.last_name}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.display_name}</p>
                  {m.team_name_snapshot && (
                    <p className="text-xs text-muted-foreground">
                      {m.team_name_snapshot}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <Label
                    htmlFor={`role-${m.key}`}
                    className="sr-only"
                  >{`Role for ${m.display_name}`}</Label>
                  <Select
                    id={`role-${m.key}`}
                    aria-label={`Role for ${m.display_name}`}
                    value={m.role}
                    onChange={(e) =>
                      handleRoleChange(m.key, e.target.value as DelegationRole)
                    }
                    className="text-xs"
                  >
                    {DELEGATION_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Remove ${m.display_name}`}
                  onClick={() => handleRemove(m.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">
            {pending.profile.display_name}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`pending-role-${meetingId}`} className="text-xs">
                Role
              </Label>
              <Select
                id={`pending-role-${meetingId}`}
                value={pending.role}
                onChange={(e) =>
                  setPending((p) =>
                    p ? { ...p, role: e.target.value as DelegationRole } : p,
                  )
                }
              >
                {DELEGATION_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
            {pending.profile.teams.length > 1 && (
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`pending-team-${meetingId}`}
                  className="text-xs"
                >
                  Team
                </Label>
                <Select
                  id={`pending-team-${meetingId}`}
                  value={pending.selectedTeam?.team_id ?? ""}
                  onChange={(e) => {
                    const found =
                      pending.profile.teams.find(
                        (t) => t.team_id === e.target.value,
                      ) ?? null;
                    setPending((p) => (p ? { ...p, selectedTeam: found } : p));
                  }}
                >
                  <option value="">No team</option>
                  {pending.profile.teams.map((t) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.team_name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddPending}
              aria-label="Add to delegation"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to delegation
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!pending && (
        <div className="relative">
          <Label htmlFor={`search-${meetingId}`} className="sr-only">
            Search members by name
          </Label>
          <Input
            id={`search-${meetingId}`}
            aria-label="Search members by name"
            placeholder="Search by name to add a delegation member…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {(searchResults.length > 0 || isSearching) && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              {isSearching && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Searching…
                </p>
              )}
              {!isSearching &&
                searchResults.length === 0 &&
                searchQuery.trim() && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No results
                  </p>
                )}
              {searchResults.map((r) => (
                <button
                  key={r.user_id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelectProfile(r)}
                >
                  <span className="font-medium">{r.display_name}</span>
                  {r.teams[0] && (
                    <span className="text-xs text-muted-foreground">
                      {r.teams[0].team_name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {representedTeams.length > 0 && (
        <div>
          <p className={SECTION_LABEL_CLASSNAME}>Represented Teams</p>
          <ul
            aria-label="Represented Teams"
            className="mt-1 flex flex-wrap gap-1.5"
          >
            {representedTeams.map((team) => (
              <li
                key={team}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {team}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
