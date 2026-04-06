import { SenatorsTable } from "@/components/representatives/senators-table";

export default async function Representatives({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Senators</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Current members of the U.S. Senate
      </p>
      <SenatorsTable page={page} />
    </div>
  );
}
