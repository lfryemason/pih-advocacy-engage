"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMeetingDetail,
  updateMeeting,
  syncDelegationMembers,
} from "@/lib/meetings/queries";
import {
  MeetingRow,
  MeetingDetail as MeetingDetailType,
  MeetingFormValues,
  LinkFormEntry,
  LocalDelegationMember,
  memberFromDelegation,
} from "@/lib/meetings/types";
import { DelegationForm } from "@/components/meetings/delegation-form";
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
  const [pendingDelegation, setPendingDelegation] = useState<
    LocalDelegationMember[]
  >([]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const loadDetails = useCallback(
    (opts?: { silent?: boolean }) => {
      let cancelled = false;
      const supabase = createClient();
      if (!opts?.silent) setIsLoading(true);
      setLoadError(null);

      fetchMeetingDetail(supabase, meeting.id)
        .then((d) => {
          if (cancelled) return;
          // Don't overwrite in-progress edits while the user is in edit mode.
          // setDetail is also guarded: detail.delegation_members is the original
          // baseline for syncDelegationMembers, so it must stay in sync with
          // pendingDelegation (which is not reset in edit mode).
          if (modeRef.current !== "edit") {
            setDetail(d);
            setForm(formStateFromDetail(d));
            setLinks(d.links);
            setPendingDelegation(
              d.delegation_members.map(memberFromDelegation),
            );
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setLoadError(
            err instanceof Error
              ? err.message
              : "Failed to load meeting details",
          );
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [meeting.id],
  );

  useEffect(loadDetails, [meeting.id, loadDetails]);

  const updateForm = useCallback((partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  function handleEnterEdit() {
    setSaveError(null);
    setMode("edit");
  }

  function handleCancel() {
    if (!detail) return;
    setForm(formStateFromDetail(detail));
    setLinks(detail.links);
    setPendingDelegation(detail.delegation_members.map(memberFromDelegation));
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
      if (detail) {
        try {
          await syncDelegationMembers(
            supabase,
            meeting.id,
            detail.delegation_members,
            pendingDelegation,
          );
        } catch (err: unknown) {
          throw new Error(
            "Meeting saved, but delegation changes could not be applied: " +
              (err instanceof Error ? err.message : "Unknown error"),
          );
        }
      }

      setMode("view");

      loadDetails({ silent: true });

      onSaved();
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
      form={form}
      onFormChange={updateForm}
      links={links}
      onLinksChange={setLinks}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      saveError={saveError}
      isSaving={isSaving}
      delegationSlot={
        <DelegationForm
          meetingId={meeting.id}
          initialMembers={detail.delegation_members}
          onChange={setPendingDelegation}
        />
      }
    />
  );
}
