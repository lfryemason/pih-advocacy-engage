"use client";

import { useState } from "react";
import { Pencil, X, Plus, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export type GeneralLink = {
  label: string;
  url: string;
  category: string;
};

const CATEGORIES: { value: string; label: string; dotClass: string }[] = [
  { value: "profile", label: "Profile", dotClass: "bg-yellow-400" },
  { value: "voting_record", label: "Voting Record", dotClass: "bg-blue-500" },
  {
    value: "campaign_finance",
    label: "Campaign Finance",
    dotClass: "bg-green-500",
  },
  { value: "news", label: "News", dotClass: "bg-gray-400" },
  { value: "committee", label: "Committee", dotClass: "bg-pink-500" },
];

function dotClass(category: string): string {
  return (
    CATEGORIES.find((c) => c.value === category)?.dotClass ?? "bg-gray-300"
  );
}

function LinkChip({ link }: { link: GeneralLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-accent"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass(link.category)}`}
        aria-hidden="true"
      />
      {link.label}
    </a>
  );
}

function EditRow({
  link,
  onChange,
  onRemove,
}: {
  link: GeneralLink;
  onChange: (updated: GeneralLink) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={link.category}
        onChange={(e) => onChange({ ...link, category: e.target.value })}
        className="w-[160px] shrink-0"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      <Input
        value={link.label}
        onChange={(e) => onChange({ ...link, label: e.target.value })}
        placeholder="Label"
        className="flex-1"
      />
      <Input
        value={link.url}
        onChange={(e) => onChange({ ...link, url: e.target.value })}
        placeholder="https://..."
        className="flex-1"
        type="url"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label="Remove link"
      >
        <X size={14} />
      </Button>
    </div>
  );
}

export function RepExternalResources({
  representativeId,
  initialLinks,
  canEdit,
}: {
  representativeId: string;
  initialLinks: GeneralLink[];
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [links, setLinks] = useState<GeneralLink[]>(initialLinks);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("representatives")
      .update({ general_links: links })
      .eq("id", representativeId);
    setIsSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setIsEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setLinks(initialLinks);
    setIsEditing(false);
    setSaveError(null);
  };

  const addLink = () =>
    setLinks((prev) => [...prev, { label: "", url: "", category: "profile" }]);

  const updateLink = (i: number, updated: GeneralLink) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? updated : l)));

  const removeLink = (i: number) =>
    setLinks((prev) => prev.filter((_, idx) => idx !== i));

  if (!isEditing && links.length === 0 && !canEdit) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">External Resources</h2>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 gap-1 text-muted-foreground"
          >
            <Pencil size={13} />
            Edit
          </Button>
        )}
        {canEdit && isEditing && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-7 text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 gap-1"
            >
              <Check size={13} />
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 flex flex-col gap-2">
          {links.map((link, i) => (
            <EditRow
              key={i}
              link={link}
              onChange={(updated) => updateLink(i, updated)}
              onRemove={() => removeLink(i)}
            />
          ))}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              className="mt-1 gap-1"
            >
              <Plus size={13} />
              Add link
            </Button>
          </div>
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        </div>
      ) : (
        <>
          {links.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {links.map((link, i) => (
                  <LinkChip key={i} link={link} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {CATEGORIES.filter((c) =>
                  links.some((l) => l.category === c.value),
                ).map((c) => (
                  <span key={c.value} className="flex items-center gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${c.dotClass}`}
                      aria-hidden="true"
                    />
                    {c.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No external resources added yet.
            </p>
          )}
        </>
      )}
    </section>
  );
}
