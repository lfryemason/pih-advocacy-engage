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
import type { MembershipWithProfile } from "@/components/teams/team-member-list";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "team_lead", label: "Team Lead" },
  { value: "fundraising_lead", label: "Fundraising Lead" },
  { value: "advocacy_lead", label: "Advocacy Lead" },
] as const;

export function MemberEditTable({
  memberships,
  teamId,
  orgId,
}: {
  memberships: MembershipWithProfile[];
  teamId: string;
  orgId: string;
}) {
  const router = useRouter();
  const [changing, setChanging] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRoleChange = async (
    userId: string,
    currentRole: string,
    newRole: string,
  ) => {
    const key = `${userId}-${currentRole}`;
    setChanging(key);
    const supabase = createClient();
    // Insert first so a failed insert leaves the original row intact.
    const { error: insertError } = await supabase
      .from("team_memberships")
      .insert({
        team_id: teamId,
        user_id: userId,
        org_id: orgId,
        role: newRole,
      });
    if (!insertError) {
      await supabase
        .from("team_memberships")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .eq("role", currentRole);
    }
    setChanging(null);
    router.refresh();
  };

  const handleRemove = async (membership: MembershipWithProfile) => {
    const name =
      [membership.profiles?.first_name, membership.profiles?.last_name]
        .filter(Boolean)
        .join(" ") || "this member";
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    const key = `${membership.user_id}-${membership.role}`;
    setRemoving(key);
    const supabase = createClient();
    await supabase
      .from("team_memberships")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", membership.user_id)
      .eq("role", membership.role);
    router.refresh();
  };

  if (memberships.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">No members yet.</p>
    );
  }

  return (
    <Table>
      <caption className="sr-only">Team members</caption>
      <TableHeader>
        <TableRow>
          <TableHead>First name</TableHead>
          <TableHead>Last name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {memberships.map((m) => {
          const key = `${m.user_id}-${m.role}`;
          return (
            <TableRow key={key}>
              <TableCell>{m.profiles?.first_name ?? "—"}</TableCell>
              <TableCell>{m.profiles?.last_name ?? "—"}</TableCell>
              <TableCell>{m.profiles?.email ?? "—"}</TableCell>
              <TableCell>
                <Select
                  value={m.role}
                  disabled={changing === key || removing === key}
                  onChange={(e) =>
                    handleRoleChange(m.user_id, m.role, e.target.value)
                  }
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={removing === key || changing === key}
                  onClick={() => handleRemove(m)}
                >
                  {removing === key ? "Removing…" : "Remove"}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
