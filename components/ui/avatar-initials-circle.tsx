import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/meetings/format";

export function AvatarInitialsCircle({
  name,
  colorClass = "bg-muted text-foreground",
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  name: string;
  colorClass?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        "h-8 w-8",
        colorClass,
      )}
      {...props}
    >
      {initials(name)}
    </span>
  );
}
