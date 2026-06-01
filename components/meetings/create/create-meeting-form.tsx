"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreateMeetingValues, LinkFormEntry } from "@/lib/meetings/types";
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

type SubmitFn = (
  values: CreateMeetingValues,
  links: LinkFormEntry[],
  primaryTeamName: string | null,
) => Promise<void>;

export function CreateMeetingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: SubmitFn;
  onCancel: () => void;
}) {
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("14:00");
  const [representativeId, setRepresentativeId] = useState("");
  const [congressionalContactId, setCongressionalContactId] = useState("");
  const [primaryTeamId, setPrimaryTeamId] = useState("");
  const [primaryTeamName, setPrimaryTeamName] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<LinkFormEntry[]>([]);

  const [staffers, setStaffers] = useState<StafferOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!meetingDate) {
      setError("Meeting date is required.");
      return;
    }
    if (!representativeId) {
      setError("Member of Congress is required.");
      return;
    }
    const notesTrimmed = notes.trim();
    if (notesTrimmed.length > 255) {
      setError("Notes must be 255 characters or fewer.");
      return;
    }

    const values: CreateMeetingValues = {
      meeting_date: meetingDate,
      meeting_time: meetingTime.trim() || null,
      meeting_timezone: MEETING_TIMEZONE,
      representative_id: representativeId,
      congressional_contact_id: congressionalContactId || null,
      primary_team_id: primaryTeamId || null,
      notes: notesTrimmed || null,
      location: location.trim() || null,
    };

    const filteredLinks = links.filter((l) => l.label.trim() || l.url.trim());

    setIsSaving(true);
    try {
      await onSubmit(values, filteredLinks, primaryTeamName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setIsSaving(false);
    }
  }

  const textareaClass =
    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[72px] resize-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <div className="flex items-baseline gap-0.5">
            <Label htmlFor="meeting-date">Date</Label>
            <span className="leading-none text-destructive" aria-hidden="true">
              *
            </span>
          </div>
          <Input
            id="meeting-date"
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-baseline gap-0.5">
            <Label htmlFor="meeting-time">Time</Label>
            <span className="min-w-0 truncate text-xs italic leading-none text-muted-foreground">
              {TZ_DISPLAY_NAME}
            </span>
          </div>
          <Input
            id="meeting-time"
            type="time"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-baseline gap-0.5">
            <Label htmlFor="meeting-representative">Member of Congress</Label>
            <span className="leading-none text-destructive" aria-hidden="true">
              *
            </span>
          </div>
          <RepresentativeCombobox
            id="meeting-representative"
            value={representativeId}
            onChange={(id) => {
              setRepresentativeId(id);
              setCongressionalContactId("");
            }}
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="meeting-contact">Congressional Contact</Label>
          <Select
            id="meeting-contact"
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
          <Label htmlFor="meeting-team">Primary PIH Team</Label>
          <TeamCombobox
            id="meeting-team"
            value={primaryTeamId}
            onChange={(id, name) => {
              setPrimaryTeamId(id);
              setPrimaryTeamName(name);
            }}
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="meeting-location">Location</Label>
          <Input
            id="meeting-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. 'Meeting Room 1, State House', or 'Virtual'"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="meeting-notes">Notes</Label>
            <span
              className={`text-xs ${notes.trim().length > 255 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {notes.trim().length}/255
            </span>
          </div>
          <textarea
            id="meeting-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={textareaClass}
            aria-label="Notes"
          />
        </div>
      </div>

      <EditMeetingLinks onChange={setLinks} />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Add meeting"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
