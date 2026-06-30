export const TYPE_LABELS: Record<string, string> = {
  high_school: "High School",
  university: "College/University",
  city: "City",
};

export const TYPE_BADGE_CLASS: Record<string, string> = {
  high_school: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  city: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  university: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export const ROLE_LABELS = {
  member: "Member",
  team_coordinator: "Team Coordinator",
  advocacy_lead: "Advocacy Lead",
  community_building_lead: "Community Building Lead",
  fundraising_lead: "Fundraising Lead",
  coach: "Coach",
} as const;

export type TeamRole = keyof typeof ROLE_LABELS;

const ALL_ROLE_KEYS = Object.keys(ROLE_LABELS) as TeamRole[];

export const LEAD_ROLES = ALL_ROLE_KEYS.filter((r) => r !== "member");

export const LEADERSHIP_ROLES = ALL_ROLE_KEYS.filter(
  (r) => r !== "member" && r !== "coach",
).map((role) => ({ role, label: ROLE_LABELS[role] }));

export const ROLE_OPTIONS = ALL_ROLE_KEYS.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export type MembershipWithProfile = {
  role: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    pronouns: string | null;
    email: string;
    is_placeholder: boolean;
  } | null;
};

export function displayName(profiles: MembershipWithProfile["profiles"]) {
  if (!profiles) return "—";
  return (
    [profiles.first_name, profiles.last_name].filter(Boolean).join(" ") || "—"
  );
}
