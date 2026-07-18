"use client";

import { useState } from "react";
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
import type { CurrentRole } from "@/lib/auth/role";
import { useRoleChangeAction } from "@/lib/auth/use-role-change-action";
import { Info, Trash2, X } from "lucide-react";

export function MemberEditTable({
  memberships,
  teamId,
  teamSlug,
  currentRole,
}: {
  memberships: MembershipWithProfile[];
  teamId: string;
  teamSlug: string;
  currentRole: CurrentRole | null;
}) {
  const router = useRouter();
  const isAdmin =
    currentRole?.role === "super_admin" ||
    (currentRole?.role === "org_admin" && currentRole.org_id === ORG_ID);
  const isTeamMember =
    currentRole !== null &&
    memberships.some((m) => m.user_id === currentRole.user_id);
  const canAddTeammate = isTeamMember || isAdmin;
  const canDeletePlaceholders = isAdmin;
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    isPending: isRoleChangePending,
    error: roleChangeError,
    changeRole,
    clearError: clearRoleChangeError,
  } = useRoleChangeAction();
  const displayedError = actionError ?? roleChangeError;

  const handleRoleChange = (
    userId: string,
    currentRole: string,
    newRole: string,
  ) => {
    if (newRole === currentRole) return;
    setActionError(null);
    changeRole(
      `${userId}-${currentRole}`,
      () =>
        createClient().rpc("change_member_role", {
          p_team_id: teamId,
          p_user_id: userId,
          p_old_role: currentRole,
          p_new_role: newRole,
        }),
      () => "Failed to update role",
    );
  };

  const handleRemove = async (membership: MembershipWithProfile) => {
    const name =
      [membership.profiles?.first_name, membership.profiles?.last_name]
        .filter(Boolean)
        .join(" ") || "this member";
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    const key = `${membership.user_id}-${membership.role}`;
    setRemoving(key);
    setActionError(null);
    clearRoleChangeError();
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("team_memberships")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", membership.user_id)
        .eq("role", membership.role);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setRemoving(null);
    }
  };

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
    clearRoleChangeError();
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
      {displayedError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {displayedError}
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
                const isCoach = m.role === "coach";
                const isPlaceholder = m.profiles?.is_placeholder ?? false;
                return (
                  <TableRow key={key}>
                    <TableCell>
                      {[m.profiles?.first_name, m.profiles?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                      {isPlaceholder && <PendingBadge />}
                    </TableCell>
                    <TableCell>{m.profiles?.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Select
                          aria-label={`Role for ${[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "member"}`}
                          value={m.role}
                          disabled={
                            isRoleChangePending(key) || removing === key
                          }
                          onChange={(e) =>
                            handleRoleChange(m.user_id, m.role, e.target.value)
                          }
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
                          disabled={
                            removing === key || isRoleChangePending(key)
                          }
                          aria-label={`Remove ${[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "member"} from team`}
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
                            aria-label={`Permanently delete ${[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "placeholder"}'s placeholder account`}
                            onClick={() => handleHardDelete(m)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </Button>
                        )}
                      </div>
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
}
