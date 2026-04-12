import { Badge } from "@/components/ui/badge";

const partyColor: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Republican: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Independent:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function PartyBadge({ party }: { party: string }) {
  return (
    <Badge variant="outline" className={partyColor[party] ?? ""}>
      {party[0]}
    </Badge>
  );
}
