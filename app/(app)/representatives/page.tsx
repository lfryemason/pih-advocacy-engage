import { SenatorsTable } from "@/components/representatives/senators-table";

export default function Representatives() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Senators</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Current members of the U.S. Senate
      </p>
      <SenatorsTable />
    </div>
  );
}
