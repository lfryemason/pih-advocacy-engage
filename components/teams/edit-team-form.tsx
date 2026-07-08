"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/supabase/database.types";
import { ORG_ID } from "@/lib/org";
import { useTeamForm } from "@/components/teams/team-form";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import {
  MemberEditTable,
  type MemberEditTableHandle,
} from "@/components/teams/member-edit-table";
import type { MembershipWithProfile } from "@/lib/teams";
import type { CurrentRole } from "@/lib/auth/role";

type Team = Tables<"teams">;

export function EditTeamForm({
  team,
  canDelete,
  memberships,
  currentRole,
}: {
  team: Team;
  canDelete: boolean;
  memberships: MembershipWithProfile[];
  currentRole: CurrentRole | null;
}) {
  const { formId, fields, handleSubmit, isSaving, showCancel, handleCancel } =
    useTeamForm({ orgId: ORG_ID, team });
  const memberTableRef = useRef<MemberEditTableHandle>(null);
  const [isSavingMembers, setIsSavingMembers] = useState(false);

  // Member role changes/removals are staged in MemberEditTable and only
  // committed here, alongside the team fields, so nothing in the members
  // table is permanent until Save is clicked.
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMembers(true);
    const membersOk = await memberTableRef.current?.commitPendingChanges();
    setIsSavingMembers(false);
    if (membersOk === false) return;
    await handleSubmit(e);
  };

  const saving = isSaving || isSavingMembers;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[3fr_5fr] lg:items-start">
      <form
        id={formId}
        onSubmit={handleFormSubmit}
        noValidate
        className="flex max-w-lg flex-col lg:col-start-1 lg:row-start-1"
      >
        <h2 className="text-lg font-semibold">Team settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">* Required</p>
        <div className="mt-2 flex max-w-lg flex-col gap-6">{fields}</div>
      </form>
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <MemberEditTable
          ref={memberTableRef}
          memberships={memberships}
          teamId={team.id}
          teamSlug={team.slug}
          currentRole={currentRole}
        />
      </div>
      <div className="flex max-w-lg items-center gap-2 lg:col-start-1 lg:row-start-2">
        {canDelete && (
          <DeleteTeamButton
            teamId={team.id}
            teamName={team.name}
            disabled={saving}
          />
        )}
        <div className="ml-auto flex gap-2">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
