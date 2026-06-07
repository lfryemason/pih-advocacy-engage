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
        setPendingDelegation(
          d.delegation_members.map((m) => ({
            key: m.id,
            dbId: m.id,
            user_id: m.user_id,
            display_name: m.display_name,
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
            role: m.role,
            team_id: m.team_id,
            team_name_snapshot: m.team_name_snapshot,
          })),
        );
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
    setPendingDelegation(
      detail.delegation_members.map((m) => ({
        key: m.id,
        dbId: m.id,
        user_id: m.user_id,
        display_name: m.display_name,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        role: m.role,
        team_id: m.team_id,
        team_name_snapshot: m.team_name_snapshot,
      })),
    );
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
        await syncDelegationMembers(
          supabase,
          meeting.id,
          detail.delegation_members,
          pendingDelegation,
        );
      }

      // Transition to view mode before notifying the parent — the parent's
      // onSaved triggers a list refresh that can unmount this component
      // (e.g. when the meeting's date moves it to a different section).
      setMode("view");

      // Refresh detail in the background so the view panel is up-to-date
      // if the component stays mounted. Guard against post-unmount setState.
      fetchMeetingDetail(supabase, meeting.id)
        .then((d) => {
          if (!isMountedRef.current) return;
          setDetail(d);
          setLinks(d.links);
          setPendingDelegation(
            d.delegation_members.map((m) => ({
              key: m.id,
              dbId: m.id,
              user_id: m.user_id,
              display_name: m.display_name,
              first_name: m.first_name,
              last_name: m.last_name,
              email: m.email,
              role: m.role,
              team_id: m.team_id,
              team_name_snapshot: m.team_name_snapshot,
            })),
          );
        })
        .catch(() => {});

      onSaved();
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save meeting",
      );
    } finally {
      if (isMountedRef.current) setIsSaving(false);
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
    <div>
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
      />
      <div className="border-t px-4 pb-4 pt-4">
        <DelegationForm
          meetingId={meeting.id}
          initialMembers={detail.delegation_members}
          onChange={setPendingDelegation}
        />
      </div>
    </div>
  );
}
