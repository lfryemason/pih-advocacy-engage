"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createPlaceholderTeammate,
  updatePlaceholderTeammate,
  deletePlaceholderTeammate,
} from "@/lib/teams/placeholder-actions";
import type { MembershipWithProfile, TeamRole } from "@/lib/teams";
import type { ProfileSearchResult } from "@/lib/meetings/types";

export type PlaceholderFields = {
  firstName: string;
  lastName: string;
  pronouns: string;
  state: string;
  district: string;
};

// Everything the Add/Edit teammate dialog collects.
export type StagedTeammate = {
  email: string;
  role: TeamRole;
  fields: PlaceholderFields;
};

// A placeholder queued for creation; nothing is written until Save.
export type NewMember = StagedTeammate & { tempId: string };

// An existing (already-registered) user picked from search, queued to join
// the team; nothing is written until Save.
export type NewExistingMember = {
  tempId: string;
  userId: string;
  displayName: string;
  email: string;
  role: TeamRole;
};

// One entry per existing membership (keyed by `${user_id}-${role}`). Aspects are
// independent so a role change and a profile edit on the same placeholder can be
// staged together without overwriting each other. `remove`/`hardDelete`
// supersede the edit aspects at commit time.
type StagedEdit = {
  remove?: boolean;
  hardDelete?: boolean;
  role?: string;
  fields?: PlaceholderFields;
};

type Aspect = keyof StagedEdit;

const keyFor = (userId: string, role: string) => `${userId}-${role}`;

const isEmpty = (e: StagedEdit) =>
  !e.remove && !e.hardDelete && e.role === undefined && e.fields === undefined;

export function useMemberStaging({
  memberships,
  teamId,
  teamSlug,
}: {
  memberships: MembershipWithProfile[];
  teamId: string;
  teamSlug: string;
}) {
  const [pending, setPending] = useState<Map<string, StagedEdit>>(new Map());
  const [newMembers, setNewMembers] = useState<NewMember[]>([]);
  const [newExistingMembers, setNewExistingMembers] = useState<
    NewExistingMember[]
  >([]);

  const patch = (key: string, updater: (cur: StagedEdit) => StagedEdit) =>
    setPending((prev) => {
      const next = new Map(prev);
      const merged = updater(next.get(key) ?? {});
      if (isEmpty(merged)) next.delete(key);
      else next.set(key, merged);
      return next;
    });

  const stageRole = (m: MembershipWithProfile, role: string) =>
    patch(keyFor(m.user_id, m.role), (cur) => ({
      ...cur,
      role: role === m.role ? undefined : role,
    }));

  const stageRemove = (m: MembershipWithProfile) =>
    patch(keyFor(m.user_id, m.role), (cur) => ({ ...cur, remove: true }));

  const stageHardDelete = (m: MembershipWithProfile) =>
    patch(keyFor(m.user_id, m.role), (cur) => ({ ...cur, hardDelete: true }));

  const stageEdit = (m: MembershipWithProfile, fields: PlaceholderFields) =>
    patch(keyFor(m.user_id, m.role), (cur) => ({ ...cur, fields }));

  const undoRemoval = (key: string) =>
    patch(key, (cur) => ({ ...cur, remove: undefined, hardDelete: undefined }));

  const addNew = (data: StagedTeammate) =>
    setNewMembers((prev) => [
      ...prev,
      { ...data, tempId: crypto.randomUUID() },
    ]);
  const editNew = (tempId: string, data: StagedTeammate) =>
    setNewMembers((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, ...data } : m)),
    );
  const removeNew = (tempId: string) =>
    setNewMembers((prev) => prev.filter((m) => m.tempId !== tempId));

  const addExisting = (profile: ProfileSearchResult) =>
    setNewExistingMembers((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        userId: profile.user_id,
        displayName: profile.display_name,
        email: profile.email,
        role: "member",
      },
    ]);
  const editExistingRole = (tempId: string, role: TeamRole) =>
    setNewExistingMembers((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, role } : m)),
    );
  const removeExisting = (tempId: string) =>
    setNewExistingMembers((prev) => prev.filter((m) => m.tempId !== tempId));

  const hasPending =
    pending.size > 0 || newMembers.length > 0 || newExistingMembers.length > 0;

  // Runs every staged write in parallel. Each op reports which staged aspect(s)
  // it covers; succeeded aspects are cleared and failed ones stay staged so the
  // user can fix the error and retry. Returns the first error, if any.
  const commit = async (): Promise<{ ok: boolean; error: string | null }> => {
    if (!hasPending) return { ok: true, error: null };
    const supabase = createClient();

    type Op = {
      clears?: { key: string; aspect: Aspect }[];
      newIds?: string[];
      newExistingIds?: string[];
      run: () => Promise<void>;
    };
    const ops: Op[] = [];

    // Collapse plain removals into one delete per role.
    const removalsByRole = new Map<string, { ids: string[]; keys: string[] }>();

    for (const [key, edit] of pending) {
      const m = memberships.find((x) => keyFor(x.user_id, x.role) === key);
      if (!m) continue;

      if (edit.hardDelete) {
        ops.push({
          clears: [{ key, aspect: "hardDelete" }],
          run: async () => {
            const r = await deletePlaceholderTeammate({
              userId: m.user_id,
              teamSlug,
            });
            if (!r.ok) throw new Error(r.error);
          },
        });
        continue;
      }

      if (edit.remove) {
        const bucket = removalsByRole.get(m.role) ?? { ids: [], keys: [] };
        bucket.ids.push(m.user_id);
        bucket.keys.push(key);
        removalsByRole.set(m.role, bucket);
        continue;
      }

      if (edit.role !== undefined) {
        const newRole = edit.role;
        ops.push({
          clears: [{ key, aspect: "role" }],
          run: async () => {
            const { error } = await supabase.rpc("change_member_role", {
              p_team_id: teamId,
              p_user_id: m.user_id,
              p_old_role: m.role,
              p_new_role: newRole,
            });
            if (error) throw error;
          },
        });
      }

      if (edit.fields !== undefined) {
        const fields = edit.fields;
        ops.push({
          clears: [{ key, aspect: "fields" }],
          run: async () => {
            const r = await updatePlaceholderTeammate({
              userId: m.user_id,
              teamSlug,
              firstName: fields.firstName,
              lastName: fields.lastName,
              pronouns: fields.pronouns,
              state: fields.state,
              district: fields.district,
            });
            if (!r.ok) throw new Error(r.error);
          },
        });
      }
    }

    for (const [role, { ids, keys }] of removalsByRole) {
      ops.push({
        clears: keys.map((key) => ({ key, aspect: "remove" as Aspect })),
        run: async () => {
          const { error } = await supabase
            .from("team_memberships")
            .delete()
            .eq("team_id", teamId)
            .in("user_id", ids)
            .eq("role", role);
          if (error) throw error;
        },
      });
    }

    for (const nm of newMembers) {
      ops.push({
        newIds: [nm.tempId],
        run: async () => {
          const r = await createPlaceholderTeammate({
            teamId,
            email: nm.email,
            role: nm.role,
            firstName: nm.fields.firstName,
            lastName: nm.fields.lastName,
            pronouns: nm.fields.pronouns,
            state: nm.fields.state,
            district: nm.fields.district,
          });
          if (!r.ok) throw new Error(r.error);
        },
      });
    }

    for (const nem of newExistingMembers) {
      ops.push({
        newExistingIds: [nem.tempId],
        run: async () => {
          const { error } = await supabase.rpc("add_team_member", {
            p_team_id: teamId,
            p_user_id: nem.userId,
            p_role: nem.role,
          });
          if (error) throw error;
        },
      });
    }

    const results = await Promise.allSettled(ops.map((o) => o.run()));
    const clears: { key: string; aspect: Aspect }[] = [];
    const doneNew = new Set<string>();
    const doneNewExisting = new Set<string>();
    let firstError: string | null = null;
    results.forEach((res, i) => {
      if (res.status === "fulfilled") {
        ops[i].clears?.forEach((c) => clears.push(c));
        ops[i].newIds?.forEach((id) => doneNew.add(id));
        ops[i].newExistingIds?.forEach((id) => doneNewExisting.add(id));
      } else if (!firstError) {
        firstError =
          res.reason instanceof Error
            ? res.reason.message
            : "Failed to save member changes";
      }
    });

    if (clears.length > 0)
      setPending((prev) => {
        const next = new Map(prev);
        for (const { key, aspect } of clears) {
          const cur = next.get(key);
          if (!cur) continue;
          const upd = { ...cur, [aspect]: undefined };
          if (isEmpty(upd)) next.delete(key);
          else next.set(key, upd);
        }
        return next;
      });
    if (doneNew.size > 0)
      setNewMembers((prev) => prev.filter((m) => !doneNew.has(m.tempId)));
    if (doneNewExisting.size > 0)
      setNewExistingMembers((prev) =>
        prev.filter((m) => !doneNewExisting.has(m.tempId)),
      );

    return { ok: firstError === null, error: firstError };
  };

  return {
    pending,
    newMembers,
    newExistingMembers,
    hasPending,
    stageRole,
    stageRemove,
    stageHardDelete,
    stageEdit,
    undoRemoval,
    addNew,
    editNew,
    removeNew,
    addExisting,
    editExistingRole,
    removeExisting,
    commit,
  };
}

export type MemberStaging = ReturnType<typeof useMemberStaging>;
