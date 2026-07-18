"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ROLE_LABELS,
  displayName,
  type MembershipWithProfile,
  type TeamRole,
} from "@/lib/teams";
import { AddTeammateDialog } from "@/components/teams/add-teammate-dialog";
import { MemberEditRow } from "@/components/teams/member-edit-row";
import type { MemberStaging } from "@/components/teams/use-member-staging";
import { ORG_ID } from "@/lib/org";
import type { CurrentRole } from "@/lib/auth/role";

// Presentational: role changes, removals, placeholder edits/creates/deletes are
// all staged in `staging` (owned by EditTeamForm) and only written on Save, so
// this component holds no mutation state of its own.
export function MemberEditTable({
  memberships,
  currentRole,
  staging,
  isSaving,
}: {
  memberships: MembershipWithProfile[];
  currentRole: CurrentRole | null;
  staging: MemberStaging;
  isSaving: boolean;
}) {
  const isAdmin =
    currentRole?.role === "super_admin" ||
    (currentRole?.role === "org_admin" && currentRole.org_id === ORG_ID);
  const isTeamMember =
    currentRole !== null &&
    memberships.some((m) => m.user_id === currentRole.user_id);
  const canAddTeammate = isTeamMember || isAdmin;
  const canDeletePlaceholders = isAdmin;

  const confirmRemove = (m: MembershipWithProfile, name: string) => {
    if (window.confirm(`Remove ${name} from the team?`)) staging.stageRemove(m);
  };

  const confirmHardDelete = (m: MembershipWithProfile, name: string) => {
    if (
      window.confirm(
        `Permanently delete ${name}'s placeholder account when you save the team? ` +
          `This removes all their team memberships and delegation history and can't be undone.`,
      )
    ) {
      staging.stageHardDelete(m);
    }
  };

  const hasRows = memberships.length > 0 || staging.newMembers.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        {canAddTeammate && (
          <AddTeammateDialog onStage={(data) => staging.addNew(data)} />
        )}
      </div>
      <div className="mt-2">
        {!hasRows ? (
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
                const edit = staging.pending.get(key);
                const isRemoved = !!(edit?.remove || edit?.hardDelete);
                const effectiveRole = edit?.role ?? m.role;
                const name = edit?.fields
                  ? [edit.fields.firstName, edit.fields.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"
                  : displayName(m.profiles);
                const isPlaceholder = m.profiles?.is_placeholder ?? false;

                return (
                  <MemberEditRow
                    key={key}
                    displayName={name}
                    email={m.profiles?.email ?? "—"}
                    isPlaceholder={isPlaceholder}
                    effectiveRole={effectiveRole}
                    isRemoved={isRemoved}
                    disabled={isSaving}
                    canHardDelete={isPlaceholder && canDeletePlaceholders}
                    editDialog={
                      isPlaceholder ? (
                        <AddTeammateDialog
                          loadUserId={m.user_id}
                          onStage={(data) => staging.stageEdit(m, data.fields)}
                        />
                      ) : undefined
                    }
                    onRoleChange={(role) => staging.stageRole(m, role)}
                    onRemove={() => confirmRemove(m, name)}
                    onUndo={() => staging.undoRemoval(key)}
                    onHardDelete={() => confirmHardDelete(m, name)}
                  />
                );
              })}
              {staging.newMembers.map((nm) => {
                const name =
                  [nm.fields.firstName, nm.fields.lastName]
                    .filter(Boolean)
                    .join(" ") || "—";
                return (
                  <MemberEditRow
                    key={nm.tempId}
                    displayName={name}
                    email={nm.email}
                    isPlaceholder
                    effectiveRole={nm.role}
                    isRemoved={false}
                    disabled={isSaving}
                    editDialog={
                      <AddTeammateDialog
                        initial={nm}
                        onStage={(data) => staging.editNew(nm.tempId, data)}
                      />
                    }
                    onRoleChange={(role) =>
                      staging.editNew(nm.tempId, {
                        email: nm.email,
                        role: (role in ROLE_LABELS
                          ? role
                          : "member") as TeamRole,
                        fields: nm.fields,
                      })
                    }
                    onRemove={() => staging.removeNew(nm.tempId)}
                    onUndo={() => {}}
                  />
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
