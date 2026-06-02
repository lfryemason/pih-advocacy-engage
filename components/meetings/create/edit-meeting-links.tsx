"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LinkFormEntry } from "@/lib/meetings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EditMeetingLinks({
  onChange,
}: {
  onChange: (links: LinkFormEntry[]) => void;
}) {
  const [links, setLinks] = useState<LinkFormEntry[]>([]);

  function update(next: LinkFormEntry[]) {
    setLinks(next);
    onChange(next);
  }

  function handleAdd() {
    update([...links, { label: "", url: "" }]);
  }

  function handleRemove(i: number) {
    update(links.filter((_, idx) => idx !== i));
  }

  function handleChange(i: number, field: keyof LinkFormEntry, value: string) {
    update(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Links</span>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add link
        </Button>
      </div>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <Input
            aria-label={`Link ${i + 1} label`}
            value={link.label}
            onChange={(e) => handleChange(i, "label", e.target.value)}
            placeholder="Label"
            className="flex-1"
          />
          <Input
            aria-label={`Link ${i + 1} URL`}
            value={link.url}
            onChange={(e) => handleChange(i, "url", e.target.value)}
            placeholder="https://…"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove link ${i + 1}`}
            onClick={() => handleRemove(i)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
