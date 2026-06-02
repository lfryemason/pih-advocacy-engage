"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMeetingDetail, updateMeeting } from "@/lib/meetings/queries";
import {
  MeetingRow,
  MeetingDetail as MeetingDetailType,
  MeetingFormValues,
  LinkFormEntry,
} from "@/lib/meetings/types";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RepresentativeCombobox } from "@/components/meetings/create/representative-combobox";
import { TeamCombobox } from "@/components/meetings/create/team-combobox";
import { EditMeetingLinks } from "@/components/meetings/create/edit-meeting-links";

const MEETING_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const _tzDate = new Date();
const _tzLong =
  new Intl.DateTimeFormat("en-US", { timeZoneName: "long" })
    .formatToParts(_tzDate)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
const _tzOffset =
  new Intl.DateTimeFormat("en-US", { timeZoneName: "shortOffset" })
    .formatToParts(_tzDate)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
const TZ_DISPLAY_NAME =
  _tzLong && _tzOffset
    ? `${_tzLong}/${_tzOffset}`
    : _tzLong || _tzOffset || MEETING_TIMEZONE;

type StafferOption = {
  id: string;
  first_name: string;
  last_name: string;
};

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[72px] resize-none";

function formStateFromDetail(d: MeetingDetailType) {
  return {
    meetingDate: d.meeting_date,
    meetingTime: d.meeting_time ?? "",
    representativeId: d.representative_id,
    congressionalContactId: d.congressional_contact_id ?? "",
    primaryTeamId: d.primary_team_id ?? "",
    location: d.location ?? "",
    notes: d.notes ?? "",
    followUpDate: d.follow_up_date ?? "",
    championScore: d.champion_score != null ? String(d.champion_score) : "",
    links: d.links,
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

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [representativeId, setRepresentativeId] = useState("");
  const [congressionalContactId, setCongressionalContactId] = useState("");
  const [primaryTeamId, setPrimaryTeamId] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [championScore, setChampionScore] = useState("");
  const [links, setLinks] = useState<LinkFormEntry[]>([]);
  const [initialLinks, setInitialLinks] = useState<LinkFormEntry[]>([]);

  const [staffers, setStaffers] = useState<StafferOption[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    setIsLoading(true);
    setLoadError(null);

    fetchMeetingDetail(supabase, meeting.id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        const form = formStateFromDetail(d);
        setMeetingDate(form.meetingDate);
        setMeetingTime(form.meetingTime);
        setRepresentativeId(form.representativeId);
        setCongressionalContactId(form.congressionalContactId);
        setPrimaryTeamId(form.primaryTeamId);
        setLocation(form.location);
        setNotes(form.notes);
        setFollowUpDate(form.followUpDate);
        setChampionScore(form.championScore);
        setLinks(form.links);
        setInitialLinks(form.links);
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

  useEffect(() => {
    if (!representativeId) {
      setStaffers([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("staffers")
      .select("id, first_name, last_name")
      .eq("representative_id", representativeId)
      .order("last_name")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setStaffers(rows);
        setCongressionalContactId((prev) =>
          rows.find((s) => s.id === prev) ? prev : "",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [representativeId]);

  function handleEnterEdit() {
    setSaveError(null);
    setMode("edit");
  }

  function handleCancel() {
    if (!detail) return;
    const form = formStateFromDetail(detail);
    setMeetingDate(form.meetingDate);
    setMeetingTime(form.meetingTime);
    setRepresentativeId(form.representativeId);
    setCongressionalContactId(form.congressionalContactId);
    setPrimaryTeamId(form.primaryTeamId);
    setLocation(form.location);
    setNotes(form.notes);
    setFollowUpDate(form.followUpDate);
    setChampionScore(form.championScore);
    setLinks(form.links);
    setSaveError(null);
    setMode("view");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    if (!meetingDate) {
      setSaveError("Meeting date is required.");
      return;
    }
    if (!representativeId) {
      setSaveError("Member of Congress is required.");
      return;
    }
    const notesTrimmed = notes.trim();
    if (notesTrimmed.length > 255) {
      setSaveError("Notes must be 255 characters or fewer.");
      return;
    }
    const parsedScore =
      championScore !== "" ? parseInt(championScore, 10) : null;
    if (
      parsedScore !== null &&
      (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5)
    ) {
      setSaveError("Champion score must be between 0 and 5.");
      return;
    }

    const values: MeetingFormValues = {
      meeting_date: meetingDate,
      meeting_time: meetingTime.trim() || null,
      meeting_timezone: MEETING_TIMEZONE,
      representative_id: representativeId,
      congressional_contact_id: congressionalContactId || null,
      primary_team_id: primaryTeamId || null,
      notes: notesTrimmed || null,
      location: location.trim() || null,
      follow_up_date: followUpDate || null,
      champion_score: parsedScore,
    };

    setIsSaving(true);
    try {
      const supabase = createClient();
      await updateMeeting(supabase, meeting.id, values, links);
      onSaved();

      let cancelled = false;
      fetchMeetingDetail(supabase, meeting.id)
        .then((d) => {
          if (cancelled) return;
          setDetail(d);
          setInitialLinks(d.links);
        })
        .catch(() => {});

      setMode("view");

      return () => {
        cancelled = true;
      };
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
      <div className="p-6">
        <p role="status" className="text-muted-foreground">
          Loading meeting details…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <p role="alert" className="text-destructive">
          {loadError}
        </p>
      </div>
    );
  }

  if (mode === "view" && detail) {
    return <MeetingDetailView meeting={detail} onEdit={handleEnterEdit} />;
  }

  return (
    <div className="border-t p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-baseline gap-0.5">
              <Label htmlFor={`edit-date-${meeting.id}`}>Date</Label>
              <span
                className="leading-none text-destructive"
                aria-hidden="true"
              >
                *
              </span>
            </div>
            <Input
              id={`edit-date-${meeting.id}`}
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline gap-0.5">
              <Label htmlFor={`edit-time-${meeting.id}`}>Time</Label>
              <span className="min-w-0 truncate text-xs italic leading-none text-muted-foreground">
                {TZ_DISPLAY_NAME}
              </span>
            </div>
            <Input
              id={`edit-time-${meeting.id}`}
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-baseline gap-0.5">
              <Label htmlFor={`edit-rep-${meeting.id}`}>
                Member of Congress
              </Label>
              <span
                className="leading-none text-destructive"
                aria-hidden="true"
              >
                *
              </span>
            </div>
            <RepresentativeCombobox
              id={`edit-rep-${meeting.id}`}
              value={representativeId}
              onChange={(id) => {
                setRepresentativeId(id);
                setCongressionalContactId("");
              }}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`edit-contact-${meeting.id}`}>
              Congressional Contact
            </Label>
            <Select
              id={`edit-contact-${meeting.id}`}
              value={congressionalContactId}
              onChange={(e) => setCongressionalContactId(e.target.value)}
              disabled={!representativeId}
            >
              <option value="">— Meeting with representative directly —</option>
              {staffers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`edit-team-${meeting.id}`}>Primary PIH Team</Label>
            <TeamCombobox
              id={`edit-team-${meeting.id}`}
              value={primaryTeamId}
              onChange={(id) => setPrimaryTeamId(id)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`edit-location-${meeting.id}`}>Location</Label>
            <Input
              id={`edit-location-${meeting.id}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 'Meeting Room 1, State House', or 'Virtual'"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor={`edit-notes-${meeting.id}`}>Notes</Label>
              <span
                className={`text-xs ${notes.trim().length > 255 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {notes.trim().length}/255
              </span>
            </div>
            <textarea
              id={`edit-notes-${meeting.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={textareaClass}
              aria-label="Notes"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`edit-followup-${meeting.id}`}>
              Follow-up Date
            </Label>
            <Input
              id={`edit-followup-${meeting.id}`}
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`edit-champion-${meeting.id}`}>
              Champion Score (0–5)
            </Label>
            <Input
              id={`edit-champion-${meeting.id}`}
              type="number"
              value={championScore}
              onChange={(e) => setChampionScore(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>

        <EditMeetingLinks
          key={meeting.id}
          initialLinks={initialLinks}
          onChange={setLinks}
        />

        {saveError && (
          <p className="text-sm text-destructive" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
