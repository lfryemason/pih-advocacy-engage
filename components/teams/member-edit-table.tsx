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
import type { MembershipWithProfile } from "@/lib/teams";
import { Info, X } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "team_coordinator", label: "Team Coordinator" },
  { value: "advocacy_lead", label: "Advocacy Lead" },
  { value: "community_building_lead", label: "Community Building Lead" },
  { value: "fundraising_lead", label: "Fundraising Lead" },
  { value: "coach", label: "Coach" },
] as const;

export function MemberEditTable({
  memberships,
  teamId,
}: {
  memberships: MembershipWithProfile[];
  teamId: string;
}) {
  const router = useRouter();
  const [changing, setChanging] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRoleChange = async (
    userId: string,
    currentRole: string,
    newRole: string,
  ) => {
    if (newRole === currentRole) return;
    const key = `${userId}-${currentRole}`;
    setChanging(key);
    setActionError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("change_member_role", {
        p_team_id: teamId,
        p_user_id: userId,
        p_old_role: currentRole,
        p_new_role: newRole,
      });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update role",
      );
    } finally {
      setChanging(null);
    }
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

  return (
    <div>
      <h2 className="text-lg font-semibold">Members</h2>
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
                const isCoach = m.role === "coach";
                return (
                  <TableRow key={key}>
                    <TableCell>
                      {[m.profiles?.first_name, m.profiles?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </TableCell>
                    <TableCell>{m.profiles?.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Select
                          aria-label={`Role for ${[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "member"}`}
                          value={m.role}
                          disabled={changing === key || removing === key}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-1 text-muted-foreground hover:text-destructive"
                        disabled={removing === key || changing === key}
                        aria-label={`Remove ${[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "member"} from team`}
                        onClick={() => handleRemove(m)}
                      >
                        <X size={14} aria-hidden="true" />
                      </Button>
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
