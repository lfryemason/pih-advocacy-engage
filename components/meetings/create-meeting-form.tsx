"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { CreateMeetingValues, LinkFormEntry } from "@/lib/meetings/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import {
  FilterCombobox,
  ComboboxOption,
} from "@/components/meetings/filter-combobox";

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
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [meetingTime, setMeetingTime] = useState("14:00");
  const meetingTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const tzLong =
    new Intl.DateTimeFormat("en-US", { timeZoneName: "long" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const tzOffset =
    new Intl.DateTimeFormat("en-US", {
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const tzDisplayName =
    tzLong && tzOffset
      ? `${tzLong}/${tzOffset}`
      : tzLong || tzOffset || meetingTimezone;
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

  const myRepIds = new Set(
    representatives
      .filter((r) => {
        if (!profileState || r.state !== profileState) return false;
        if (r.district === null) return true;
        if (!profileDistrict || profileDistrict === "at-large") return false;
        const distNum = parseInt(profileDistrict, 10);
        return !isNaN(distNum) && r.district === distNum;
      })
      .map((r) => r.id),
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
      meeting_date: format(meetingDate, "yyyy-MM-dd"),
      meeting_time: meetingTime.trim() || null,
      meeting_timezone: meetingTimezone,
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

  const repOptions: ComboboxOption[] = representatives.map((r) => ({
    id: r.id,
    label: repLabel(r),
  }));

  const teamOptions: ComboboxOption[] = teams.map((t) => ({
    id: t.id,
    label: t.name,
  }));

  const textareaClass =
    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[72px] resize-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="meeting-date">
            Date{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="meeting-date"
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
              >
                {meetingDate ? (
                  format(meetingDate, "PPP")
                ) : (
                  <span className="text-muted-foreground">Select date</span>
                )}
                <ChevronDownIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={meetingDate}
                captionLayout="dropdown"
                defaultMonth={meetingDate}
                onSelect={(date) => {
                  setMeetingDate(date);
                  setDatePickerOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="meeting-time">
            Time{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>{" "}
            <span className="text-xs italic leading-none text-muted-foreground">
              {tzDisplayName}
            </span>
          </Label>
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
          <Label htmlFor="meeting-representative">
            Member of Congress{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <FilterCombobox
            id="meeting-representative"
            options={repOptions}
            priorityIds={myRepIds}
            priorityGroupLabel="My Representatives"
            required
            value={representativeId}
            onChange={(id) => {
              setRepresentativeId(id);
              setCongressionalContactId("");
            }}
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="meeting-contact">
            Congressional Contact{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Select
            id="meeting-contact"
            required
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
