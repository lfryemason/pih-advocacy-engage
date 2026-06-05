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
import { CHAMPION_LABELS } from "@/lib/meetings/meeting-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RepresentativeCombobox } from "@/components/meetings/create/representative-combobox";
import { TeamCombobox } from "@/components/meetings/create/team-combobox";
import { EditMeetingLinks } from "@/components/meetings/create/edit-meeting-links";
import { TimezoneSelect } from "@/components/meetings/create/timezone-select";

const MEETING_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const SECTION_LABEL_CLASSNAME =
  "font-semibold uppercase tracking-wide text-muted-foreground";

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[72px] resize-none";

type StafferOption = {
  id: string;
  first_name: string;
  last_name: string;
};

function formStateFromDetail(d: MeetingDetailType) {
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
  const [meetingTimezone, setMeetingTimezone] = useState(MEETING_TIMEZONE);
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
        setMeetingTimezone(form.meetingTimezone);
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
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return;
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
    setMeetingTimezone(form.meetingTimezone);
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
    const parsedScore = championScore !== "" ? Number(championScore) : null;

    const values: MeetingFormValues = {
      meeting_date: meetingDate,
      meeting_time: meetingTime.trim() || null,
      meeting_timezone: meetingTimezone,
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

      const savedLinks = links.filter((l) => l.label.trim() || l.url.trim());
      setInitialLinks(savedLinks);
      fetchMeetingDetail(supabase, meeting.id)
        .then((d) => {
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

  if (mode === "view" && detail) {
    return <MeetingDetailView meeting={detail} onEdit={handleEnterEdit} />;
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 @[600px]:grid-cols-2">
          {/* Left column — who + outcome + content */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <p className={SECTION_LABEL_CLASSNAME}>
                  <Label htmlFor={`edit-rep-${meeting.id}`}>
                    Member of Congress
                  </Label>
                </p>
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

            <div className="flex flex-col gap-2">
              <p className={SECTION_LABEL_CLASSNAME}>
                <Label htmlFor={`edit-contact-${meeting.id}`}>
                  Congressional Contact
                </Label>
              </p>
              <Select
                id={`edit-contact-${meeting.id}`}
                value={congressionalContactId}
                onChange={(e) => setCongressionalContactId(e.target.value)}
                disabled={!representativeId}
              >
                <option value="">
                  — Meeting with representative directly —
                </option>
                {staffers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <p className={SECTION_LABEL_CLASSNAME}>
                <Label htmlFor={`edit-team-${meeting.id}`}>
                  Primary PIH Team
                </Label>
              </p>
              <TeamCombobox
                id={`edit-team-${meeting.id}`}
                value={primaryTeamId}
                onChange={(id) => setPrimaryTeamId(id)}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className={SECTION_LABEL_CLASSNAME}>
                  <Label htmlFor={`edit-champion-${meeting.id}`}>
                    Champion Score
                  </Label>
                </p>
                <Select
                  id={`edit-champion-${meeting.id}`}
                  value={championScore}
                  onChange={(e) => setChampionScore(e.target.value)}
                >
                  <option value="">—</option>
                  {Object.entries(CHAMPION_LABELS).map(([score, label]) => (
                    <option key={score} value={score}>
                      {score} – {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className={SECTION_LABEL_CLASSNAME}>
                  <Label htmlFor={`edit-followup-${meeting.id}`}>
                    Follow-up
                  </Label>
                </p>
                <Input
                  id={`edit-followup-${meeting.id}`}
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p className={SECTION_LABEL_CLASSNAME}>
                  <Label htmlFor={`edit-notes-${meeting.id}`}>Notes</Label>
                </p>
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

            <EditMeetingLinks
              key={meeting.id}
              initialLinks={initialLinks}
              onChange={setLinks}
            />
          </div>

          {/* Right column — when + where */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-baseline gap-1">
                  <p className={SECTION_LABEL_CLASSNAME}>
                    <Label htmlFor={`edit-date-${meeting.id}`}>Date</Label>
                  </p>
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
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className={SECTION_LABEL_CLASSNAME}>
                  <Label htmlFor={`edit-time-${meeting.id}`}>Time</Label>
                </p>
                <Input
                  id={`edit-time-${meeting.id}`}
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className={SECTION_LABEL_CLASSNAME}>
                <Label htmlFor={`edit-timezone-${meeting.id}`}>Timezone</Label>
              </p>
              <TimezoneSelect
                id={`edit-timezone-${meeting.id}`}
                value={meetingTimezone}
                onChange={setMeetingTimezone}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className={SECTION_LABEL_CLASSNAME}>
                <Label htmlFor={`edit-location-${meeting.id}`}>Location</Label>
              </p>
              <Input
                id={`edit-location-${meeting.id}`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 'Meeting Room 1, State House', or 'Virtual'"
              />
            </div>

            <div className="mt-auto pt-2">
              {saveError && (
                <p className="mb-2 text-sm text-destructive" role="alert">
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
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
