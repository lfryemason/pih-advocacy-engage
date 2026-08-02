"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchDelegationMemberOptions } from "@/lib/meetings/queries";
import type { DelegationMemberOption } from "@/lib/meetings/types";

export function useDelegationMembers(
  enabled: boolean,
): DelegationMemberOption[] {
  const [members, setMembers] = useState<DelegationMemberOption[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchDelegationMemberOptions(createClient())
      .then((result) => {
        if (!cancelled) setMembers(result);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return members;
}
