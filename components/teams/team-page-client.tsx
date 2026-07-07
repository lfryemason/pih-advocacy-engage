"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import { displayName, TYPE_BADGE_CLASS, TYPE_LABELS } from "@/lib/teams";
import { NameWithPronouns } from "@/components/teams/name-with-pronouns";
import {
  TeamMemberList,
  type MembershipWithProfile,
} from "@/components/teams/team-member-list";
import { TeamLeadSectionList } from "@/components/teams/team-lead-section-list";
import { TeamRepList } from "@/components/teams/team-rep-list";
import { TeamMeetingsSection } from "@/components/teams/team-meetings-section";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";

type Team = Tables<"teams">;

export function TeamPageClient({
  team,
  memberships,
  orgId,
  currentUserId,
  isOrgAdmin = false,
  meetingCounts = {},
}: {
  team: Team;
  memberships: MembershipWithProfile[];
  orgId: string;
  currentUserId: string | null;
  isOrgAdmin?: boolean;
  meetingCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isMember =
    currentUserId !== null &&
    memberships.some((m) => m.user_id === currentUserId);

  const coaches = memberships.filter((m) => m.role === "coach");

  const handleJoin = async () => {
    if (!currentUserId) return;
    setIsJoining(true);
    setJoinError(null);
    const supabase = createClient();
    const { error } = await supabase.from("team_memberships").insert({
      team_id: team.id,
      user_id: currentUserId,
      org_id: orgId,
      role: "member",
    });
    if (error) {
      setJoinError("Failed to join team");
    } else {
      router.refresh();
    }
    setIsJoining(false);
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/teams">Teams</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{team.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <Badge
              variant="outline"
              className={TYPE_BADGE_CLASS[team.type] ?? ""}
            >
              {TYPE_LABELS[team.type as keyof typeof TYPE_LABELS] ?? team.type}
            </Badge>
          </div>
          {team.founded_date && (
            <p className="mt-1 text-muted-foreground">
              Founded {team.founded_date}
            </p>
          )}
          {team.state && (
            <p className="mt-1 text-muted-foreground">
              {US_STATES.find((s) => s.code === team.state)?.name ?? team.state}
              {team.congressional_districts.length > 0 && (
                <>
                  {" — "}
                  {team.congressional_districts
                    .map((d: string) => {
                      const opt = getDistrictOptions(team.state ?? "").find(
                        (o) => o.value === d,
                      );
                      return opt?.label ?? d;
                    })
                    .join(", ")}
                </>
              )}
            </p>
          )}
          {coaches.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              {coaches.length === 1 ? "Coach" : "Coaches"}:{" "}
              {coaches.map((c, i) => (
                <span key={c.user_id}>
                  {i > 0 && " & "}
                  <NameWithPronouns
                    name={displayName(c.profiles)}
                    pronouns={c.profiles?.pronouns}
                  />
                  {c.profiles?.email && (
                    <>
                      {" • "}
                      <a
                        href={`mailto:${c.profiles.email}`}
                        className="inline-flex items-center gap-0.5 hover:underline"
                      >
                        <Mail size={13} aria-hidden="true" />
                        {c.profiles.email}
                      </a>
                    </>
                  )}
                </span>
              ))}
            </p>
          )}
          {team.description && (
            <p className="mt-3 text-sm">{team.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            {!isMember && currentUserId && (
              <Button size="sm" onClick={handleJoin} disabled={isJoining}>
                {isJoining ? "Joining…" : "Join team"}
              </Button>
            )}
            {(isMember || isOrgAdmin) && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/teams/${team.slug}/edit`}>Edit</Link>
              </Button>
            )}
          </div>
          {joinError && (
            <p role="alert" className="text-sm text-destructive">
              {joinError}
            </p>
          )}
        </div>
      </div>
      <TeamLeadSectionList
        memberships={memberships}
        meetingCounts={meetingCounts}
      />
      <TeamRepList
        state={team.state ?? ""}
        congressionalDistricts={team.congressional_districts}
      />
      <TeamMeetingsSection teamId={team.id} />
      <TeamMemberList memberships={memberships} meetingCounts={meetingCounts} />
    </>
  );
}
