import { createClient } from "@/lib/supabase/server";
import { SenatorsTableBody } from "@/components/representatives/senators-table-body";

const PAGE_SIZE = 25;

export async function SenatorsTable({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);
  const supabase = await createClient();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { count } = await supabase
    .from("representatives")
    .select("id", { count: "exact", head: true })
    .eq("chamber", "sen")
    .eq("in_office", true);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const { data: senators, error } = await supabase
    .from("representatives")
    .select()
    .eq("chamber", "sen")
    .eq("in_office", true)
    .order("state")
    .order("last_name")
    .range(from, to);

  if (error) {
    return <p className="text-destructive">Failed to load senators.</p>;
  }

  if (senators.length === 0 && page === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No senators found.
      </p>
    );
  }

  return (
    <SenatorsTableBody
      senators={senators}
      page={page}
      totalPages={totalPages}
    />
  );
}
