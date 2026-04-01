import { createClient } from "@/lib/supabase/server";
import { SenatorsTable } from "@/components/representatives/senators-table";

export default async function Representatives() {
  const supabase = await createClient();

  const { data: senators, error } = await supabase
    .from("representatives")
    .select()
    .eq("chamber", "sen")
    .eq("in_office", true)
    .order("state")
    .order("last_name");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Senators</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Current members of the U.S. Senate
      </p>
      {error ? (
        <p className="text-destructive">Failed to load senators.</p>
      ) : (
        <SenatorsTable senators={senators ?? []} />
      )}
    </div>
  );
}
