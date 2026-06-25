"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { debounce } from "es-toolkit";
import { createClient } from "@/lib/supabase/client";
import { searchProfiles } from "@/lib/meetings/queries";
import type { ProfileSearchResult } from "@/lib/meetings/types";

export function MemberSearchPicker({
  selectedIds,
  onAdd,
  disabled,
  placeholder = "Member",
}: {
  selectedIds: string[];
  onAdd: (userId: string, displayName: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
          setResults([]);
          setIsLoading(false);
          return;
        }
        try {
          const supabase = createClient();
          const profiles = await searchProfiles(supabase, searchQuery);
          setResults(profiles);
        } catch {
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    if (query.trim()) setIsLoading(true);
    else setIsLoading(false);
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filteredResults = results.filter(
    (profile) => !selectedIds.includes(profile.user_id),
  );
  const showDropdown =
    isOpen && (isLoading || filteredResults.length > 0 || query.trim() !== "");

  function handleSelect(profile: ProfileSearchResult) {
    onAdd(profile.user_id, profile.display_name);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-40">
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </p>
          ) : filteredResults.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No results.
            </p>
          ) : (
            filteredResults.map((profile) => (
              <button
                key={profile.user_id}
                type="button"
                className="flex w-full cursor-default select-none items-center px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleSelect(profile);
                }}
              >
                {profile.display_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
