import { createClient } from "@/lib/supabase/server";
import { ORG_ID } from "@/lib/org";
import { LEAD_ROLES, TYPE_LABELS } from "@/lib/teams";
import { US_STATES } from "@/lib/us-districts";
import {
  TeamsTableClient,
  type TeamTableRow,
} from "@/components/teams/teams-table-client";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
  type: string;
  team_memberships: { role: string; user_id: string }[];
};

const LEAD_ROLE_SET = new Set<string>(
  LEAD_ROLES.filter((role) => role !== "coach"),
);

function distinctUsers(
  memberships: { role: string; user_id: string }[],
  predicate: (role: string) => boolean,
): number {
  const ids = new Set(
    memberships.filter((m) => predicate(m.role)).map((m) => m.user_id),
  );
  return ids.size;
}

export async function TeamsTable() {
  const supabase = await createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, slug, state, type, team_memberships(role, user_id)")
    .eq("org_id", ORG_ID)
    .order("name");

  if (error)
    return <p className="mt-6 text-destructive">Error: {error.message}</p>;
  if (!teams?.length)
    return <p className="mt-6 text-muted-foreground">No teams yet.</p>;

  const rows: TeamTableRow[] = (teams as TeamRow[]).map((team) => ({
    name: team.name,
    slug: team.slug,
    type: team.type,
    typeLabel: TYPE_LABELS[team.type as keyof typeof TYPE_LABELS] ?? team.type,
    state: US_STATES.find((s) => s.code === team.state)?.name ?? team.state,
    leads: distinctUsers(team.team_memberships, (role) =>
      LEAD_ROLE_SET.has(role),
    ),
    members: distinctUsers(team.team_memberships, (role) => role !== "coach"),
  }));

  return <TeamsTableClient teams={rows} />;
}
