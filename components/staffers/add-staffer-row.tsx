"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { StafferForm } from "@/components/staffers/staffer-form";

export function AddStafferRow({
  representativeId,
  orgId,
}: {
  representativeId: string;
  orgId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (isOpen) {
    return (
      <div className="rounded-lg border p-4">
        <StafferForm
          representativeId={representativeId}
          orgId={orgId}
          onDone={() => {
            setIsOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsOpen(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      <Plus className="size-4" />
      Add office staff
    </button>
  );
}
