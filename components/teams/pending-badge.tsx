"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Marks a placeholder teammate who hasn't claimed their account yet. */
export function PendingBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="ml-1.5" tabIndex={0}>
          Pending
        </Badge>
      </TooltipTrigger>
      <TooltipContent>This member hasn&apos;t signed up yet</TooltipContent>
    </Tooltip>
  );
}
