export const CHAMBERS = [
  { value: "rep", label: "House" },
  { value: "sen", label: "Senate" },
] as const;

export type Chamber = (typeof CHAMBERS)[number]["value"];
