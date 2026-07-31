"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StafferOption } from "@/lib/meetings/types";

export function useStaffers(representativeId: string): StafferOption[] {
  const [staffers, setStaffers] = useState<StafferOption[]>([]);

  useEffect(() => {
    if (!representativeId) {
      setStaffers([]);
      return;
    }
    let cancelled = false;

    function fetchStaffers() {
      createClient()
        .from("staffers")
        .select("id, first_name, last_name")
        .eq("representative_id", representativeId)
        .order("last_name")
        .then(({ data }) => {
          if (cancelled) return;
          setStaffers(data ?? []);
        });
    }

    fetchStaffers();

    function handleFocus() {
      if (document.visibilityState === "visible") {
        fetchStaffers();
      }
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [representativeId]);

  return staffers;
}
