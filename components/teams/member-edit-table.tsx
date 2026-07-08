"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_OPTIONS, type MembershipWithProfile } from "@/lib/teams";
import { AddTeammateDialog } from "@/components/teams/add-teammate-dialog";
import { PendingBadge } from "@/components/teams/pending-badge";
import { deletePlaceholderTeammate } from "@/lib/teams/placeholder-actions";
import { ORG_ID } from "@/lib/org";
import { cn } from "@/lib/utils";
import type { CurrentRole } from "@/lib/auth/role";
import { Info, Trash2, X } from "lucide-react";

// Role changes and removals are staged locally and only committed to the
// database when the caller (EditTeamForm) invokes commitPendingChanges, so
// they follow the same Save/Cancel contract as the rest of the team form.
type PendingChange = { type: "remove" } | { type: "role"; newRole: string };

export type MemberEditTableHandle = {
  commitPendingChanges: () => Promise<boolean>;
};

export const MemberEditTable = forwardRef<
  MemberEditTableHandle,
  {
    memberships: MembershipWithProfile[];
    teamId: string;
    teamSlug: string;
    currentRole: CurrentRole | null;
  }
>(function MemberEditTable(
  { memberships, teamId, teamSlug, currentRole },
  ref,
) {
  const router = useRouter();
  const isAdmin =
    currentRole?.role === "super_admin" ||
    (currentRole?.role === "org_admin" && currentRole.org_id === ORG_ID);
  const isTeamMember =
    currentRole !== null &&
    memberships.some((m) => m.user_id === currentRole.user_id);
  const canAddTeammate = isTeamMember || isAdmin;
  const canDeletePlaceholders = isAdmin;
  const [pending, setPending] = useState<Record<string, PendingChange>>({});
  const [isCommitting, setIsCommitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRoleChange = (
    membership: MembershipWithProfile,
    newRole: string,
  ) => {
    const key = `${membership.user_id}-${membership.role}`;
    setPending((prev) => {
      const next = { ...prev };
      if (newRole === membership.role) {
        delete next[key];
      } else {
        next[key] = { type: "role", newRole };
      }
      return next;
    });
  };

  const handleRemove = (membership: MembershipWithProfile) => {
    const key = `${membership.user_id}-${membership.role}`;
    setPending((prev) => ({ ...prev, [key]: { type: "remove" } }));
  };

  const handleUndoRemove = (key: string) => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const commitPendingChanges = async () => {
    const entries = Object.entries(pending);
    if (entries.length === 0) return true;
    setActionError(null);
    setIsCommitting(true);
    const supabase = createClient();
    const remaining = { ...pending };
    let ok = true;
    for (const [key, change] of entries) {
      const membership = memberships.find(
        (m) => `${m.user_id}-${m.role}` === key,
      );
      if (!membership) {
        delete remaining[key];
        continue;
      }
      try {
        if (change.type === "remove") {
          const { error } = await supabase
            .from("team_memberships")
            .delete()
            .eq("team_id", teamId)
            .eq("user_id", membership.user_id)
            .eq("role", membership.role);
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc("change_member_role", {
            p_team_id: teamId,
            p_user_id: membership.user_id,
            p_old_role: membership.role,
            p_new_role: change.newRole,
          });
          if (error) throw error;
        }
        delete remaining[key];
      } catch (err) {
        ok = false;
        setActionError(
          err instanceof Error ? err.message : "Failed to save member changes",
        );
        break;
      }
    }
    setPending(remaining);
    setIsCommitting(false);
    if (ok) router.refresh();
    return ok;
  };

  useImperativeHandle(ref, () => ({ commitPendingChanges }));

  const handleHardDelete = async (membership: MembershipWithProfile) => {
    const name =
      [membership.profiles?.first_name, membership.profiles?.last_name]
        .filter(Boolean)
        .join(" ") || "this placeholder";
    const typed = window.prompt(
      `Permanently delete ${name}'s placeholder account, including all team memberships and delegation history? This cannot be undone.\n\nType DELETE to confirm.`,
    );
    if (typed !== "DELETE") return;
    const key = `${membership.user_id}-${membership.role}`;
    setDeleting(key);
    setActionError(null);
    const result = await deletePlaceholderTeammate({
      userId: membership.user_id,
      teamSlug,
    });
    if (result.ok) {
      router.refresh();
    } else {
      setActionError(result.error);
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        {canAddTeammate && (
          <AddTeammateDialog teamId={teamId} teamSlug={teamSlug} />
        )}
      </div>
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {actionError}
        </p>
      )}
      <div className="mt-2">
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <Table>
            <caption className="sr-only">Team members</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => {
                const key = `${m.user_id}-${m.role}`;
                const change = pending[key];
                const isPendingRemoval = change?.type === "remove";
                const effectiveRole =
                  change?.type === "role" ? change.newRole : m.role;
                const isCoach = effectiveRole === "coach";
                const isPlaceholder = m.profiles?.is_placeholder ?? false;
                const displayName =
                  [m.profiles?.first_name, m.profiles?.last_name]
                    .filter(Boolean)
                    .join(" ") || "—";
                return (
                  <TableRow
                    key={key}
                    className={cn(isPendingRemoval && "opacity-50")}
                  >
                    <TableCell>
                      <span className={cn(isPendingRemoval && "line-through")}>
                        {displayName}
                      </span>
                      {isPlaceholder && <PendingBadge />}
                    </TableCell>
                    <TableCell>{m.profiles?.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Select
                          aria-label={`Role for ${displayName === "—" ? "member" : displayName}`}
                          value={effectiveRole}
                          disabled={isCommitting || isPendingRemoval}
                          onChange={(e) => handleRoleChange(m, e.target.value)}
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
                      {isPendingRemoval ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          disabled={isCommitting}
                          onClick={() => handleUndoRemove(key)}
                        >
                          Undo
                        </Button>
                      ) : (
                        <div className="flex items-center">
                          {isPlaceholder && (
                            <AddTeammateDialog
                              teamId={teamId}
                              teamSlug={teamSlug}
                              editUserId={m.user_id}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-1 text-muted-foreground hover:text-destructive"
                            disabled={isCommitting}
                            aria-label={`Remove ${displayName === "—" ? "member" : displayName} from team`}
                            onClick={() => handleRemove(m)}
                          >
                            <X size={14} aria-hidden="true" />
                          </Button>
                          {isPlaceholder && canDeletePlaceholders && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-1 text-muted-foreground hover:text-destructive"
                              disabled={deleting === key}
                              aria-label={`Permanently delete ${displayName === "—" ? "placeholder" : displayName}'s placeholder account`}
                              onClick={() => handleHardDelete(m)}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
});
