"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Staffer = Tables<"staffers">;

export function StafferForm({
  representativeId,
  orgId,
  staffer,
  onDone,
  onCancel,
}: {
  representativeId: string;
  orgId: string;
  staffer?: Staffer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = staffer !== undefined;
  const [firstName, setFirstName] = useState(staffer?.first_name ?? "");
  const [lastName, setLastName] = useState(staffer?.last_name ?? "");
  const [title, setTitle] = useState(staffer?.title ?? "");
  const [pronouns, setPronouns] = useState(staffer?.pronouns ?? "");
  const [email, setEmail] = useState(staffer?.email ?? "");
  const [phone, setPhone] = useState(staffer?.phone ?? "");
  const [location, setLocation] = useState(staffer?.location ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(staffer?.linkedin_url ?? "");
  const [notes, setNotes] = useState(staffer?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();
    if (!firstNameTrimmed || !lastNameTrimmed) {
      setError("First name and last name are required.");
      return;
    }

    const supabase = createClient();
    setIsSaving(true);

    const payload = {
      first_name: firstNameTrimmed,
      last_name: lastNameTrimmed,
      title: title.trim() || null,
      pronouns: pronouns.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      location: location.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from("staffers")
          .update(payload)
          .eq("id", staffer.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("staffers").insert({
          ...payload,
          representative_id: representativeId,
          org_id: orgId,
        });
        if (insertError) throw insertError;
      }
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save staffer");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="staffer-first-name">First name</Label>
          <Input
            id="staffer-first-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-last-name">Last name</Label>
          <Input
            id="staffer-last-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-title">Title</Label>
          <Input
            id="staffer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chief of Staff"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-pronouns">Pronouns</Label>
          <Input
            id="staffer-pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="e.g. she/her"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-email">Email</Label>
          <Input
            id="staffer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-phone">Phone</Label>
          <Input
            id="staffer-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. (202) 555-0100"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-location">Location</Label>
          <Input
            id="staffer-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Washington, D.C."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="staffer-linkedin">LinkedIn URL</Label>
          <Input
            id="staffer-linkedin"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="staffer-notes">Notes (markdown)</Label>
          <textarea
            ref={notesRef}
            id="staffer-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={cn(
              inputClass,
              "max-h-[520px] min-h-[72px] resize-none overflow-y-auto",
            )}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save" : "Add staffer"}
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
