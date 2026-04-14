import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RepresentativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: representative } = await supabase
    .from("representatives")
    .select()
    .eq("bioguide_id", id)
    .single();

  if (!representative) {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        {representative.official_full_name ??
          `${representative.first_name} ${representative.last_name}`}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {representative.party} — {representative.state}
      </p>
    </div>
  );
}
