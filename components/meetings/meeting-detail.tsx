"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetingDetail } from "@/lib/meetings/queries";
import type {
  MeetingRow,
  MeetingDetail as MeetingDetailType,
} from "@/lib/meetings/types";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";

export function MeetingDetail({ meeting }: { meeting: MeetingRow }) {
  const [detail, setDetail] = useState<MeetingDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    setIsLoading(true);
    setLoadError(null);

    fetchMeetingDetail(supabase, meeting.id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load meeting details",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meeting.id]);

  if (isLoading)
    return (
      <div className="border-t p-6 text-sm text-muted-foreground">Loading…</div>
    );
  if (loadError)
    return (
      <div className="border-t p-6 text-sm text-destructive">{loadError}</div>
    );
  if (!detail) return null;

  return <MeetingDetailView meeting={detail} onEdit={() => {}} />;
}
