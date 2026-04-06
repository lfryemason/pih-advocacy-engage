"use client";

import { useRouter } from "next/navigation";
import { Tables } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Representative = Tables<"representatives">;

const partyColor: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Republican: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Independent:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function SenatorsTableBody({
  senators,
  page,
  totalPages,
}: {
  senators: Representative[];
  page: number;
  totalPages: number;
}) {
  const router = useRouter();

  return (
    <div className="max-w-[50%]">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Name</TableHead>
              <TableHead className="text-primary-foreground">State</TableHead>
              <TableHead className="text-primary-foreground">Party</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {senators.map((senator) => (
              <TableRow
                key={senator.id}
                className="cursor-pointer hover:underline"
                onClick={() =>
                  router.push(`/representatives/${senator.bioguide_id}`)
                }
              >
                <TableCell className="font-medium">
                  {senator.official_full_name ??
                    `${senator.first_name} ${senator.last_name}`}
                </TableCell>
                <TableCell>{senator.state}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={partyColor[senator.party] ?? ""}
                  >
                    {senator.party[0]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/representatives?page=${page - 1}`)
              }
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/representatives?page=${page + 1}`)
              }
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
