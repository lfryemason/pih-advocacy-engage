"use client";

import { useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DelegationMember } from "@/lib/meetings/types";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/meetings/meeting-roles";
import { AvatarInitialsCircle } from "@/components/ui/avatar-initials-circle";

export function MemberAvatar({ member }: { member: DelegationMember }) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colorClass = ROLE_COLORS[member.role];

  useEffect(() => {
    if (!clicked) return;
    function handleClose(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setClicked(false);
        return;
      }
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("keydown", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleClose);
    };
  }, [clicked]);

  return (
    <TooltipProvider>
      <Tooltip open={hovered || clicked}>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            className="shrink-0 rounded-full"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => setClicked((v) => !v)}
            aria-label={`${member.display_name} — ${ROLE_LABELS[member.role]}`}
          >
            <AvatarInitialsCircle
              firstName={member.first_name}
              lastName={member.last_name}
              colorClass={colorClass}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-48 bg-accent text-accent-foreground"
          arrowClassName="bg-accent fill-accent"
        >
          <p className="text-sm font-bold">{ROLE_LABELS[member.role]}</p>
          <p className="text-sm font-medium">{member.display_name}</p>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="text-sm italic underline-offset-4 hover:underline"
            >
              {member.email}
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
