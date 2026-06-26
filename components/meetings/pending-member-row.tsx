"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { debounce } from "es-toolkit";
import { createClient } from "@/lib/supabase/client";
import { searchProfiles } from "@/lib/meetings/queries";
import { ROLE_LABELS, DELEGATION_ROLES } from "@/lib/meetings/meeting-roles";
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
import { Loader2, Trash2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const filteredInitialGroups = useMemo(
    () =>
      myTeamGroups
        .map((group) => ({
          ...group,
          profiles: group.profiles.filter(
            (profile) => !excludedUserIds.has(profile.user_id),
          ),
        }))
        .filter((group) => group.profiles.length > 0),
    [myTeamGroups, excludedUserIds],
  );

  const groupedResults = useMemo((): TeamGroup[] => {
    if (!searchQuery.trim()) return [];
    const map = new Map<string, TeamGroup>();
    const noTeam: ProfileSearchResult[] = [];
    for (const result of searchResults.filter(
      (result) => !excludedUserIds.has(result.user_id),
    )) {
      if (result.teams.length === 0) {
        noTeam.push(result);
      } else {
        for (const team of result.teams) {
          if (!map.has(team.team_id)) {
            map.set(team.team_id, {
              team_id: team.team_id,
              team_name: team.team_name,
              profiles: [],
            });
          }
          map.get(team.team_id)!.profiles.push(result);
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
  }, [searchResults, searchQuery, excludedUserIds]);

  const runSearch = useCallback(
    (query: string) => {
      abortControllerRef.current?.abort();
      if (!query.trim()) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsSearching(true);
      setSearchError(null);
      searchProfiles(supabase, query)
        .then((results) => {
          if (controller.signal.aborted) return;
          setSearchResults(results);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setSearchError(
            err instanceof Error ? err.message : "Search failed. Try again.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    },
    [supabase],
  );

  const debouncedSearch = useMemo(() => debounce(runSearch, 300), [runSearch]);

  useEffect(
    () => () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    },
    [debouncedSearch],
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const showDropdown =
    inputFocused &&
    (!row.profile || searchActive) &&
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

  function selectProfile(
    profile: ProfileSearchResult,
    teamOverride?: ProfileTeam,
  ) {
    onUpdate(row.key, profile, teamOverride, row.role);
    setSearchQuery("");
    setSearchResults([]);
    setInputFocused(false);
    setSearchActive(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed p-2">
      <div ref={commandRef} className="min-w-0 flex-1">
        <Command
          shouldFilter={false}
          label="Search members by name"
          className="w-full"
        >
          <CommandInput
            placeholder="Search by name…"
            value={row.profile?.display_name ?? searchQuery}
            autoFocus={focusOnMount}
            onValueChange={(val) => {
              if (row.profile) {
                onUpdate(row.key, null, undefined, row.role);
                setSearchActive(true);
              }
              setSearchQuery(val);
              setInputFocused(true);
            }}
            onClick={() => {
              if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
              setInputFocused(true);
            }}
            onBlur={() => {
              if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
              blurTimerRef.current = setTimeout(() => {
                setInputFocused(false);
                setSearchActive(false);
              }, 100);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setInputFocused(false);
              }
            }}
            autoComplete="off"
          />
          {(!row.profile || searchActive) &&
            createPortal(
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
                        <CommandLoading>
                          <div className="flex justify-center p-2">
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          </div>
                        </CommandLoading>
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
                            {group.profiles.map((profile) => (
                              <CommandItem
                                key={`${profile.user_id}-${group.team_id}`}
                                value={`${profile.user_id}::${group.team_id}`}
                                onSelect={() =>
                                  selectProfile(
                                    profile,
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
                                  {profile.display_name}
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
                        {group.profiles.map((profile) => (
                          <CommandItem
                            key={`${profile.user_id}-${group.team_id}`}
                            value={`${profile.user_id}::${group.team_id}`}
                            onSelect={() =>
                              selectProfile(profile, {
                                team_id: group.team_id,
                                team_name: group.team_name,
                              })
                            }
                            className="cursor-pointer flex-col items-start"
                          >
                            <span className="font-medium">
                              {profile.display_name}
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
