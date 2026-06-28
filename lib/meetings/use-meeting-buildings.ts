"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetingBuildings } from "@/lib/meetings/queries";

export function useMeetingBuildings(): string[] {
  const [buildings, setBuildings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchMeetingBuildings(createClient())
      .then((result) => {
        if (!cancelled) setBuildings(result);
      })
      .catch(() => {
        if (!cancelled) setBuildings([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return buildings;
}
