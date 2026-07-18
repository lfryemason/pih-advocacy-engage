"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/supabase/database.types";
import { ORG_ID } from "@/lib/org";
import { useTeamForm } from "@/components/teams/team-form";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import { MemberEditTable } from "@/components/teams/member-edit-table";
import { useMemberStaging } from "@/components/teams/use-member-staging";
import { FormActionBar } from "@/components/form-action-bar";
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
  const router = useRouter();
  const { formId, fields, validate, commitTeam, showCancel, handleCancel } =
    useTeamForm({ orgId: ORG_ID, team });
  const staging = useMemberStaging({
    memberships,
    teamId: team.id,
    teamSlug: team.slug,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Validate/trim the team fields first (so an invalid form never touches the
  // members), then commit the staged member changes and the team update
  // together. On any failure show a combined error and stay put — succeeded
  // changes are cleared and failed ones remain staged for retry.
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const payload = validate();
    if (!payload) return;

    setSaving(true);
    const [memberResult, teamResult] = await Promise.all([
      staging.commit(),
      commitTeam(payload),
    ]);
    setSaving(false);

    const errors = [
      memberResult.error,
      teamResult.ok ? null : teamResult.error,
    ].filter((m): m is string => Boolean(m));
    if (errors.length > 0) {
      setSaveError(errors.join(" "));
      // Some writes may have landed before another failed; refresh so the table
      // reflects the DB. Succeeded changes are already cleared from staging;
      // failed ones stay staged (their rows are unchanged, so keys still match).
      router.refresh();
      return;
    }

    router.refresh();
    router.replace(`/teams/${team.slug}`);
  };

  return (
    <div>
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
        <div className="lg:col-start-2 lg:row-start-1">
          <MemberEditTable
            memberships={memberships}
            currentRole={currentRole}
            staging={staging}
            isSaving={saving}
          />
        </div>
      </div>
      <FormActionBar>
        {canDelete && (
          <DeleteTeamButton
            teamId={team.id}
            teamName={team.name}
            disabled={saving}
          />
        )}
        <div className="ml-auto flex items-center gap-3">
          {saveError && (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          )}
          <div className="flex gap-2">
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
      </FormActionBar>
    </div>
  );
}
