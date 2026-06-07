"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { searchProfiles } from "@/lib/meetings/queries";
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
  const [inputFocused, setInputFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members],
  );

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
    [existingUserIds],
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

  function addProfile(profile: ProfileSearchResult) {
    const firstTeam = profile.teams[0] ?? null;
    updateMembers([
      ...members,
      {
        key: crypto.randomUUID(),
        dbId: null,
        user_id: profile.user_id,
        display_name: profile.display_name,
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        pronouns: profile.pronouns,
        email: null,
        role: "attendee_listening",
        team_id: firstTeam?.team_id ?? null,
        team_name_snapshot: firstTeam?.team_name ?? null,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  }

  const showDropdown = inputFocused && !!searchQuery.trim();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={SECTION_LABEL_CLASSNAME}>Delegation</p>

        <div className="mt-2 flex items-center gap-2">
          <Command shouldFilter={false} className="relative min-w-0 flex-1">
            <Label htmlFor={`search-${meetingId}`} className="sr-only">
              Search members by name
            </Label>
            <CommandInput
              id={`search-${meetingId}`}
              placeholder="Search by name to add…"
              value={searchQuery}
              onValueChange={setSearchQuery}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 100)}
              autoComplete="off"
            />
            {showDropdown && (
              <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background shadow-md">
                <CommandList>
                  {isSearching && <CommandLoading>Searching…</CommandLoading>}
                  {!isSearching && searchResults.length === 0 && (
                    <CommandEmpty>No results</CommandEmpty>
                  )}
                  {searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((r) => (
                        <CommandItem
                          key={r.user_id}
                          value={r.user_id}
                          onSelect={() => addProfile(r)}
                          className="flex-col items-start"
                        >
                          <span className="font-medium">{r.display_name}</span>
                          {r.teams.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {r.teams.map((t) => t.team_name).join(", ")}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </div>
            )}
          </Command>

          <Button
            type="button"
            size="sm"
            aria-label="Add to delegation"
            disabled={searchResults.length === 0}
            onClick={() => {
              if (searchResults[0]) addProfile(searchResults[0]);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

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
  );
}
