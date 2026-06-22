"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { debounce } from "es-toolkit";
import { createClient } from "@/lib/supabase/client";
import { searchProfiles, fetchMyTeamMembers } from "@/lib/meetings/queries";
import { ROLE_LABELS } from "@/lib/meetings/meeting-roles";
import { SECTION_LABEL_CLASSNAME } from "@/lib/meetings/format";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
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

const DELEGATION_ROLES = Object.keys(ROLE_LABELS) as DelegationRole[];

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [myTeamGroups, setMyTeamGroups] = useState<TeamGroup[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const commandRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [pendingProfile, setPendingProfile] =
    useState<ProfileSearchResult | null>(null);
  const [pendingTeam, setPendingTeam] = useState<ProfileTeam | undefined>(
    undefined,
  );
  const [pendingRole, setPendingRole] = useState<DelegationRole>("attendee");
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createClient());

  const existingUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members],
  );

  const existingUserIdsRef = useRef(existingUserIds);
  useEffect(() => {
    existingUserIdsRef.current = existingUserIds;
  }, [existingUserIds]);

  useEffect(() => {
    fetchMyTeamMembers(supabaseRef.current)
      .then(setMyTeamGroups)
      .catch(() => {})
      .finally(() => setIsLoadingInitial(false));
  }, []);

  const filteredInitialGroups = useMemo(
    () =>
      myTeamGroups
        .map((g) => ({
          ...g,
          profiles: g.profiles.filter((p) => !existingUserIds.has(p.user_id)),
        }))
        .filter((g) => g.profiles.length > 0),
    [myTeamGroups, existingUserIds],
  );

  const representedTeams = useMemo(() => {
    const seen = new Set<string>();
    const teams: string[] = [];
    for (const m of members) {
      const name = m.team_name_snapshot;
      if (name && !seen.has(name)) {
        seen.add(name);
        teams.push(name);
      }
    }
    return teams;
  }, [members]);

  const groupedResults = useMemo((): TeamGroup[] => {
    if (!searchQuery.trim()) return [];
    const map = new Map<string, TeamGroup>();
    const noTeam: ProfileSearchResult[] = [];
    for (const r of searchResults.filter(
      (r) => !existingUserIds.has(r.user_id),
    )) {
      if (r.teams.length === 0) {
        noTeam.push(r);
      } else {
        for (const t of r.teams) {
          if (!map.has(t.team_id)) {
            map.set(t.team_id, {
              team_id: t.team_id,
              team_name: t.team_name,
              profiles: [],
            });
          }
          map.get(t.team_id)!.profiles.push(r);
        }
      }
    }
    const groups: TeamGroup[] = [...map.values()];
    if (noTeam.length > 0) {
      groups.push({
        team_id: "__none__",
        team_name: "Unknown",
        profiles: noTeam,
      });
    }
    return groups;
  }, [searchResults, searchQuery, existingUserIds]);

  const runSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    searchProfiles(supabaseRef.current, q)
      .then((results) => {
        setSearchResults(
          results.filter((r) => !existingUserIdsRef.current.has(r.user_id)),
        );
      })
      .catch((err: unknown) => {
        setSearchError(
          err instanceof Error ? err.message : "Search failed. Try again.",
        );
      })
      .finally(() => setIsSearching(false));
  }, []);

  const debouncedSearch = useMemo(() => debounce(runSearch, 300), [runSearch]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

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

  function selectProfile(
    profile: ProfileSearchResult,
    teamOverride?: ProfileTeam,
  ) {
    setPendingProfile(profile);
    setPendingTeam(teamOverride);
    setSearchQuery("");
    setSearchResults([]);
  }

  function addProfile() {
    if (!pendingProfile) return;
    if (members.some((m) => m.user_id === pendingProfile.user_id)) return;
    const team = pendingTeam ?? pendingProfile.teams[0] ?? null;
    updateMembers([
      ...members,
      {
        key: crypto.randomUUID(),
        dbId: null,
        user_id: pendingProfile.user_id,
        display_name: pendingProfile.display_name,
        first_name: pendingProfile.first_name ?? "",
        last_name: pendingProfile.last_name ?? "",
        pronouns: pendingProfile.pronouns,
        email: null,
        role: pendingRole,
        team_id: team?.team_id ?? null,
        team_name_snapshot: team?.team_name ?? null,
        display_teams: team
          ? [{ team_id: team.team_id, team_name: team.team_name }]
          : [],
      },
    ]);
    setPendingProfile(null);
    setPendingTeam(undefined);
    setSearchQuery("");
    setSearchResults([]);
  }

  const showDropdown =
    inputFocused &&
    !pendingProfile &&
    (!!searchQuery.trim() ||
      isLoadingInitial ||
      filteredInitialGroups.length > 0);

  useEffect(() => {
    if (!showDropdown) return;

    function updatePos() {
      if (commandRef.current) {
        const { bottom, left, width } =
          commandRef.current.getBoundingClientRect();
        setDropdownPos({ top: bottom + 4, left, width });
      }
    }

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [showDropdown]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={SECTION_LABEL_CLASSNAME}>Delegation</p>

        <div className="mt-2 flex items-center gap-2">
          <div ref={commandRef} className="min-w-0 flex-1">
            <Command
              shouldFilter={false}
              label="Search members by name"
              className="w-full"
            >
              <CommandInput
                placeholder="Search by name to add…"
                value={pendingProfile?.display_name ?? searchQuery}
                onValueChange={(val) => {
                  if (pendingProfile) {
                    setPendingProfile(null);
                    setPendingTeam(undefined);
                  }
                  setSearchQuery(val);
                }}
                onFocus={() => {
                  if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                  setInputFocused(true);
                }}
                onBlur={() => {
                  if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                  blurTimerRef.current = setTimeout(
                    () => setInputFocused(false),
                    100,
                  );
                }}
                autoComplete="off"
              />
              {createPortal(
                <div
                  className={
                    showDropdown && dropdownPos
                      ? "rounded-md border bg-background shadow-md"
                      : undefined
                  }
                  style={
                    showDropdown && dropdownPos
                      ? {
                          position: "fixed",
                          zIndex: 50,
                          top: dropdownPos.top,
                          left: dropdownPos.left,
                          width: dropdownPos.width,
                        }
                      : { display: "none" }
                  }
                >
                  <CommandList>
                    {searchQuery.trim() ? (
                      <>
                        {isSearching && (
                          <CommandLoading>Searching…</CommandLoading>
                        )}
                        {!isSearching && searchError && (
                          <CommandEmpty>{searchError}</CommandEmpty>
                        )}
                        {!isSearching &&
                          !searchError &&
                          groupedResults.length === 0 && (
                            <CommandEmpty>No results</CommandEmpty>
                          )}
                        {!isSearching &&
                          !searchError &&
                          groupedResults.map((group) => (
                            <CommandGroup
                              key={group.team_id}
                              heading={group.team_name}
                            >
                              {group.profiles.map((r) => (
                                <CommandItem
                                  key={`${r.user_id}-${group.team_id}`}
                                  value={`${r.user_id}::${group.team_id}`}
                                  onSelect={() =>
                                    selectProfile(
                                      r,
                                      group.team_id !== "__none__"
                                        ? {
                                            team_id: group.team_id,
                                            team_name: group.team_name,
                                          }
                                        : undefined,
                                    )
                                  }
                                  className="cursor-pointer flex-col items-start"
                                >
                                  <span className="font-medium">
                                    {r.display_name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                      </>
                    ) : isLoadingInitial ? (
                      <CommandLoading>Loading…</CommandLoading>
                    ) : (
                      filteredInitialGroups.map((group) => (
                        <CommandGroup
                          key={group.team_id}
                          heading={group.team_name}
                        >
                          {group.profiles.map((r) => (
                            <CommandItem
                              key={`${r.user_id}-${group.team_id}`}
                              value={`${r.user_id}::${group.team_id}`}
                              onSelect={() =>
                                selectProfile(r, {
                                  team_id: group.team_id,
                                  team_name: group.team_name,
                                })
                              }
                              className="cursor-pointer flex-col items-start"
                            >
                              <span className="font-medium">
                                {r.display_name}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))
                    )}
                  </CommandList>
                </div>,
                document.body,
              )}
            </Command>
          </div>

          <Label htmlFor={`pending-role-${meetingId}`} className="sr-only">
            Role for new member
          </Label>
          <Select
            id={`pending-role-${meetingId}`}
            value={pendingRole}
            onChange={(e) => setPendingRole(e.target.value as DelegationRole)}
            className="shrink-0 cursor-pointer text-xs"
          >
            {DELEGATION_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            aria-label="Add to delegation"
            disabled={!pendingProfile}
            onClick={addProfile}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {representedTeams.length > 0 && (
        <div>
          <p className={SECTION_LABEL_CLASSNAME}>Represented teams</p>
          <ul
            aria-label="Represented teams"
            className="mt-1 flex flex-wrap gap-1"
          >
            {representedTeams.map((name) => (
              <li key={name} className="text-xs text-muted-foreground">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {members.length > 0 && (
        <div className="flex flex-col gap-2">
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
                {m.display_teams.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {m.display_teams.map((t) => t.team_name).join(", ")}
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
  );
}
