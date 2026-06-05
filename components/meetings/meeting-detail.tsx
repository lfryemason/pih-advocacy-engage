"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetingDetail, updateMeeting } from "@/lib/meetings/queries";
import {
  MeetingRow,
  MeetingDetail as MeetingDetailType,
  MeetingFormValues,
  LinkFormEntry,
} from "@/lib/meetings/types";
import { DEFAULT_MEETING_TIMEZONE } from "@/lib/meetings/constants";
import { validateMeetingFields } from "@/lib/meetings/validate";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import {
  MeetingDetailEdit,
  type FormState,
} from "@/components/meetings/meeting-detail-edit";

const DEFAULT_FORM: FormState = {
  meetingDate: "",
  meetingTime: "",
  meetingTimezone: DEFAULT_MEETING_TIMEZONE,
  representativeId: "",
  congressionalContactId: "",
  primaryTeamId: "",
  location: "",
  notes: "",
  followUpDate: "",
  championScore: "",
};

function formStateFromDetail(d: MeetingDetailType): FormState {
  return {
    meetingDate: d.meeting_date,
    meetingTime: d.meeting_time ?? "",
    meetingTimezone: d.meeting_timezone,
    representativeId: d.representative_id,
    congressionalContactId: d.congressional_contact_id ?? "",
    primaryTeamId: d.primary_team_id ?? "",
    location: d.location ?? "",
    notes: d.notes ?? "",
    followUpDate: d.follow_up_date ?? "",
    championScore: d.champion_score != null ? String(d.champion_score) : "",
  };
}

export function MeetingDetail({
  meeting,
  onSaved,
}: {
  meeting: MeetingRow;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [detail, setDetail] = useState<MeetingDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [links, setLinks] = useState<LinkFormEntry[]>([]);
  const [initialLinks, setInitialLinks] = useState<LinkFormEntry[]>([]);
  const [editSessionKey, setEditSessionKey] = useState(0);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    setIsLoading(true);
    setLoadError(null);

    fetchMeetingDetail(supabase, meeting.id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setForm(formStateFromDetail(d));
        setLinks(d.links);
        setInitialLinks(d.links);
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

  function updateForm(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function handleEnterEdit() {
    setSaveError(null);
    setEditSessionKey((k) => k + 1); // remounts EditMeetingLinks with fresh initialLinks
    setMode("edit");
  }

  function handleCancel() {
    if (!detail) return;
    const state = formStateFromDetail(detail);
    setForm(state);
    setLinks(detail.links);
    setInitialLinks(detail.links); // fix: reset so EditMeetingLinks remounts clean
    setSaveError(null);
    setMode("view");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const error = validateMeetingFields(
      form.meetingDate,
      form.representativeId,
      form.notes,
    );
    if (error) {
      setSaveError(error);
      return;
    }

    const parsedScore =
      form.championScore !== "" ? Number(form.championScore) : null;

    const values: MeetingFormValues = {
      meeting_date: form.meetingDate,
      meeting_time: form.meetingTime.trim() || null,
      meeting_timezone: form.meetingTimezone,
      representative_id: form.representativeId,
      congressional_contact_id: form.congressionalContactId || null,
      primary_team_id: form.primaryTeamId || null,
      notes: form.notes.trim() || null,
      location: form.location.trim() || null,
      follow_up_date: form.followUpDate || null,
      champion_score: parsedScore,
    };

    setIsSaving(true);
    try {
      const supabase = createClient();
      await updateMeeting(supabase, meeting.id, values, links);
      onSaved();

      // Refresh detail in the background; guard against unmount
      const savedLinks = links.filter((l) => l.label.trim() || l.url.trim());
      setInitialLinks(savedLinks);
      fetchMeetingDetail(supabase, meeting.id)
        .then((d) => {
          if (!isMountedRef.current) return;
          setDetail(d);
          setInitialLinks(d.links);
        })
        .catch(() => {});

      setMode("view");
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save meeting",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p role="status" className="text-sm text-muted-foreground">
          Loading meeting details…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4">
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      </div>
    );
  }

  // Guard: detail must be loaded before showing either panel
  if (!detail) return null;

  if (mode === "view") {
    return <MeetingDetailView meeting={detail} onEdit={handleEnterEdit} />;
  }

  return (
    <MeetingDetailEdit
      meetingId={meeting.id}
      editSessionKey={editSessionKey}
      form={form}
      onFormChange={updateForm}
      initialLinks={initialLinks}
      onLinksChange={setLinks}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      saveError={saveError}
      isSaving={isSaving}
    />
  );
}
