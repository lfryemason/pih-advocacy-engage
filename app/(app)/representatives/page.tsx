import { CongressTable } from "@/components/representatives/congress-table";
import { SenatorsTable } from "@/components/representatives/senators-table";

export default function Representatives() {
  return (
    <div className="flex flex-col p-8">
      <h1 className="mb-6 text-3xl font-bold">Representatives</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <SenatorsTable />
        <CongressTable />
      </div>
    </div>
  );
}
