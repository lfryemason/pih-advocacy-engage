import { CongressTable } from "@/components/representatives/congress-table";
import { SenatorsTable } from "@/components/representatives/senators-table";

export default function Representatives() {
  return (
    <div className="flex gap-8 p-8">
      <SenatorsTable />
      <CongressTable />
    </div>
  );
}
