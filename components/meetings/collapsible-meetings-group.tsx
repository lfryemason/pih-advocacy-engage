"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function CollapsibleMeetingsGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `${title.toLowerCase().replace(/\s+/g, "-")}-content`;

  return (
    <section aria-label={title}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center gap-2 py-1"
      >
        {open ? (
          <ChevronDown
            size={20}
            className="shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            size={20}
            className="shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <span className="text-2xl font-bold">{title}</span>
      </button>
      <div id={contentId} className="mt-4 flex flex-col gap-10" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
