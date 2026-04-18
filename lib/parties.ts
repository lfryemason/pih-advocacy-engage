export const PARTIES = ["Democrat", "Republican", "Independent"] as const;

export type Party = (typeof PARTIES)[number];
