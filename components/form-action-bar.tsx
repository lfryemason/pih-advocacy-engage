import { cn } from "@/lib/utils";

// Full-width bar pinned to the bottom of the scrolling <main> (see the app
// layout's `overflow-y-auto`), so a form's Save/Cancel controls stay on screen
// and read as applying to the whole page rather than one column. The negative
// margin cancels the page's `p-8` padding so the bar spans edge to edge.
export function FormActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-8 mt-8 border-t bg-background px-8 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
