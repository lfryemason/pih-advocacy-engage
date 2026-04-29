"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import { TYPE_LABELS } from "@/components/teams/team-form";
import {
  TeamMemberList,
  type MembershipWithProfile,
} from "@/components/teams/team-member-list";

type Team = Tables<"teams">;

export function TeamPageClient({
  team,
  memberships,
  orgId,
  currentUserId,
}: {
  team: Team;
  memberships: MembershipWithProfile[];
  orgId: string;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const isMember =
    currentUserId !== null &&
    memberships.some((m) => m.user_id === currentUserId);

  const handleJoin = async () => {
    if (!currentUserId) return;
    setIsJoining(true);
    const supabase = createClient();
    await supabase.from("team_memberships").insert({
      team_id: team.id,
      user_id: currentUserId,
      org_id: orgId,
      role: "member",
    });
    router.refresh();
    setIsJoining(false);
  };

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/teams">← Teams</Link>
        </Button>
      </div>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {team.state} —{" "}
            {TYPE_LABELS[team.type as keyof typeof TYPE_LABELS] ?? team.type}
            {" team"}
            {team.founded_date && ` — Founded ${team.founded_date}`}
          </p>
          {team.description && (
            <p className="mt-3 text-sm">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isMember && currentUserId && (
            <Button size="sm" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? "Joining…" : "Join team"}
            </Button>
          )}
          {isMember && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/teams/${team.slug}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>
      <TeamMemberList memberships={memberships} />
    </>
  );
}
