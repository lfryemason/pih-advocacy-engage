"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
