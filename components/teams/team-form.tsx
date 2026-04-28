"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { US_STATES } from "@/lib/us-districts";
import { cn } from "@/lib/utils";

type Team = Tables<"teams">;

export const TYPE_LABELS = {
  high_school: "High School",
  university: "University",
  city: "City",
} as const;

export function TeamForm({
  orgId,
  team,
  onDone,
  onCancel,
}: {
  orgId: string;
  team?: Team;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEdit = team !== undefined;

  const [name, setName] = useState(team?.name ?? "");
  const [state, setState] = useState(team?.state ?? "");
  const [type, setType] = useState(team?.type ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [foundedDate, setFoundedDate] = useState(team?.founded_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameTrimmed = name.trim();
    if (!nameTrimmed || !state || !type) {
      setError("Name, state, and type are required.");
      return;
    }

    const supabase = createClient();
    setIsSaving(true);

    const payload = {
      name: nameTrimmed,
      state,
      type,
      description: description.trim() || null,
      founded_date: foundedDate || null,
    };

    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from("teams")
          .update(payload)
          .eq("id", team.id);
        if (updateError) throw updateError;
        router.refresh();
        onDone?.();
      } else {
        const { data, error: insertError } = await supabase
          .from("teams")
          .insert({ ...payload, org_id: orgId })
          .select("id, slug")
          .single();
        if (insertError) throw insertError;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("team_memberships").insert({
            team_id: data.id,
            user_id: user.id,
            org_id: orgId,
            role: "team_lead",
          });
        }
        router.replace(`/teams/${data.slug}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save team");
      setIsSaving(false);
    }
  };

  const textareaClass =
    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="team-name">Name</Label>
        <Input
          id="team-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="team-state">State</Label>
        <Select
          id="team-state"
          required
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">Select a state</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="team-type">Type</Label>
        <Select
          id="team-type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Select a type</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="team-description">Description</Label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(textareaClass, "resize-none")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="team-founded-date">Founded date</Label>
        <Input
          id="team-founded-date"
          type="date"
          value={foundedDate}
          onChange={(e) => setFoundedDate(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save" : "Create team"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
