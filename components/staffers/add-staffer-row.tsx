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
      <li className="p-4">
        <StafferForm
          representativeId={representativeId}
          orgId={orgId}
          onDone={() => {
            setIsOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsOpen(false)}
        />
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-2 bg-accent px-4 py-2 text-left text-sm text-accent-foreground transition-colors hover:bg-accent-hover hover:text-accent-hover-foreground"
      >
        <Plus className="size-4" />
        Staffer
      </button>
    </li>
  );
}
