"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreateMeetingValues, LinkFormEntry } from "@/lib/meetings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  FilterCombobox,
  ComboboxOption,
} from "@/components/meetings/filter-combobox";

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

type RepOption = {
  id: string;
  official_full_name: string | null;
  state: string;
  district: number | null;
};

type StafferOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type TeamOption = {
  id: string;
  name: string;
};

function repLabel(r: RepOption): string {
  const prefix = r.district == null ? "Sen. " : "Rep. ";
  return `${prefix}${r.official_full_name ?? "Unknown"} (${r.state})`;
}

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
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<LinkFormEntry[]>([]);

  const [representatives, setRepresentatives] = useState<RepOption[]>([]);
  const [staffers, setStaffers] = useState<StafferOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileDistrict, setProfileDistrict] = useState<string | null>(null);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("representatives")
      .select("id, official_full_name, state, district")
      .eq("in_office", true)
      .order("state")
      .order("official_full_name")
      .then(({ data }) => setRepresentatives(data ?? []));

    supabase
      .from("teams")
      .select("id, name")
      .order("name")
      .then(({ data }) => setTeams(data ?? []));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from("profiles")
          .select("state, congressional_district")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("team_memberships")
          .select("team_id")
          .eq("user_id", user.id),
      ]).then(([{ data: profile }, { data: memberships }]) => {
        if (profile?.state) {
          setProfileState(profile.state);
          setProfileDistrict(profile.congressional_district);
        }
        if (memberships) {
          setMyTeamIds(new Set(memberships.map((m) => m.team_id)));
        }
      });
    });
  }, []);

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

  const myRepIds = useMemo(
    () =>
      new Set(
        representatives
          .filter((r) => {
            if (!profileState || r.state !== profileState) return false;
            if (r.district === null) return true;
            if (!profileDistrict || profileDistrict === "at-large")
              return false;
            const distNum = parseInt(profileDistrict, 10);
            return !isNaN(distNum) && r.district === distNum;
          })
          .map((r) => r.id),
      ),
    [representatives, profileState, profileDistrict],
  );

  function handleAddLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function handleRemoveLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleLinkChange(
    i: number,
    field: keyof LinkFormEntry,
    value: string,
  ) {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    );
  }

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
    const primaryTeamName =
      teams.find((t) => t.id === primaryTeamId)?.name ?? null;

    setIsSaving(true);
    try {
      await onSubmit(values, filteredLinks, primaryTeamName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setIsSaving(false);
    }
  }

  const repOptions = useMemo<ComboboxOption[]>(
    () => representatives.map((r) => ({ id: r.id, label: repLabel(r) })),
    [representatives],
  );

  const teamOptions = useMemo<ComboboxOption[]>(
    () => teams.map((t) => ({ id: t.id, label: t.name })),
    [teams],
  );

  const textareaClass =
    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[72px] resize-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <div className="flex items-baseline gap-0.5">
            <Label htmlFor="meeting-date">Date</Label>
            <span className="text-destructive" aria-hidden="true">
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
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
            <span className="text-xs italic leading-none text-muted-foreground">
              {TZ_DISPLAY_NAME}
            </span>
          </div>
          <Input
            id="meeting-time"
            type="time"
            required
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-baseline gap-0.5">
            <Label htmlFor="meeting-representative">Member of Congress</Label>
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </div>
          <FilterCombobox
            id="meeting-representative"
            options={repOptions}
            priorityIds={myRepIds}
            priorityGroupLabel="My Representatives"
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
          <FilterCombobox
            id="meeting-team"
            options={teamOptions}
            priorityIds={myTeamIds}
            priorityGroupLabel="My Teams"
            value={primaryTeamId}
            onChange={setPrimaryTeamId}
            placeholder="— None —"
            clearLabel="— None —"
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Links</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLink}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add link
          </Button>
        </div>
        {links.map((link, i) => (
          <div key={i} className="flex gap-2">
            <Input
              aria-label={`Link ${i + 1} label`}
              value={link.label}
              onChange={(e) => handleLinkChange(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              aria-label={`Link ${i + 1} URL`}
              value={link.url}
              onChange={(e) => handleLinkChange(i, "url", e.target.value)}
              placeholder="https://…"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove link ${i + 1}`}
              onClick={() => handleRemoveLink(i)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

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
