"use client";

import { Info, Trash2, X } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_OPTIONS } from "@/lib/teams";
import { PendingBadge } from "@/components/teams/pending-badge";
import { cn } from "@/lib/utils";

export function MemberEditRow({
  displayName,
  email,
  isPlaceholder,
  effectiveRole,
  isRemoved,
  disabled,
  editDialog,
  canHardDelete,
  onRoleChange,
  onRemove,
  onUndo,
  onHardDelete,
}: {
  displayName: string;
  email: string;
  isPlaceholder: boolean;
  effectiveRole: string;
  isRemoved: boolean;
  disabled: boolean;
  editDialog?: React.ReactNode;
  canHardDelete?: boolean;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
  onUndo: () => void;
  onHardDelete?: () => void;
}) {
  const labelName = displayName === "—" ? "member" : displayName;
  const isCoach = effectiveRole === "coach";

  return (
    <TableRow className={cn(isRemoved && "text-muted-foreground")}>
      <TableCell>
        <span className={cn(isRemoved && "line-through")}>{displayName}</span>
        {isPlaceholder && <PendingBadge />}
      </TableCell>
      <TableCell>{email}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Select
            aria-label={`Role for ${labelName}`}
            value={effectiveRole}
            disabled={disabled || isRemoved}
            onChange={(e) => onRoleChange(e.target.value)}
            className="min-w-40"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {isCoach && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Coach role info"
                  className="shrink-0 text-muted-foreground"
                >
                  <Info size={14} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Coaches are excluded from membership counts
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell>
        {isRemoved ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={disabled}
            onClick={onUndo}
          >
            Undo
          </Button>
        ) : (
          <div className="flex items-center">
            {editDialog}
            <Button
              variant="ghost"
              size="sm"
              className="px-1 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              aria-label={`Remove ${labelName} from team`}
              onClick={onRemove}
            >
              <X size={14} aria-hidden="true" />
            </Button>
            {canHardDelete && onHardDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="px-1 text-muted-foreground hover:text-destructive"
                disabled={disabled}
                aria-label={`Permanently delete ${labelName}'s placeholder account`}
                onClick={onHardDelete}
              >
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
