// The slug identifying this deployment's org. Stamped onto org-scoped rows
// (user_role.org_id, representative_org_info.org_id). Must match the value
// hardcoded in the `handle_new_user` trigger in the user_role migration.
export const ORG_ID = process.env.PIHE_ORG_ID ?? "pihe";
