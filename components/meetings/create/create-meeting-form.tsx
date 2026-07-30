"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreateMeetingValues,
  LinkFormEntry,
  MeetingLocation,
  EMPTY_LOCATION,
  isLocationEmpty,
  normalizeLocationForSave,
} from "@/lib/meetings/types";
import { DEFAULT_MEETING_TIMEZONE } from "@/lib/meetings/constants";
import { validateMeetingFields } from "@/lib/meetings/validate";
import { useStaffers } from "@/lib/meetings/use-staffers";
import { LINK_CN } from "@/lib/meetings/format";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RepresentativeCombobox } from "@/components/meetings/create/representative-combobox";
import { TeamCombobox } from "@/components/meetings/create/team-combobox";
import { EditMeetingLinks } from "@/components/meetings/create/edit-meeting-links";
import { TimezoneSelect } from "@/components/meetings/create/timezone-select";
import { LocationFields } from "@/components/meetings/create/location-fields";

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
  const [meetingTimezone, setMeetingTimezone] = useState(
    DEFAULT_MEETING_TIMEZONE,
  );
  const [representativeId, setRepresentativeId] = useState("");
  const [congressionalContactId, setCongressionalContactId] = useState("");
  const [primaryTeamId, setPrimaryTeamId] = useState("");
  const [primaryTeamName, setPrimaryTeamName] = useState<string | null>(null);
  const [location, setLocation] = useState<MeetingLocation>(EMPTY_LOCATION);
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<LinkFormEntry[]>([]);

  const staffers = useStaffers(representativeId);
  const [representativeBioguideId, setRepresentativeBioguideId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!representativeId) {
      setRepresentativeBioguideId(null);
      return;
    }
    let cancelled = false;
    createClient()
      .from("representatives")
      .select("bioguide_id")
      .eq("id", representativeId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setRepresentativeBioguideId(data?.bioguide_id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [representativeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateMeetingFields(
      meetingDate,
      representativeId,
      notes,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const values: CreateMeetingValues = {
      meeting_date: meetingDate,
      meeting_time: meetingTime.trim() || null,
      meeting_timezone: meetingTimezone,
      representative_id: representativeId,
      congressional_contact_id: congressionalContactId || null,
      primary_team_id: primaryTeamId || null,
      notes: notes.trim() || null,
      location: isLocationEmpty(location)
        ? null
        : normalizeLocationForSave(location),
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
          <Label htmlFor="meeting-time">Time</Label>
          <Input
            id="meeting-time"
            type="time"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="meeting-timezone">Timezone</Label>
          <TimezoneSelect
            id="meeting-timezone"
            value={meetingTimezone}
            onChange={setMeetingTimezone}
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
          <p className="text-xs italic text-muted-foreground">
            Don&apos;t see the staffer you are meeting with?{" "}
            <Link
              href={`/representatives${representativeBioguideId ? "/" + representativeBioguideId : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CN}
            >
              Click here
            </Link>{" "}
            to add them
          </p>
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
          <Label>Location</Label>
          <LocationFields
            idPrefix="meeting-location"
            value={location}
            onChange={setLocation}
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
          <Textarea
            id="meeting-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            aria-label="Notes"
          />
        </div>
      </div>

      <EditMeetingLinks links={links} onChange={setLinks} />

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
