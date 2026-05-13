import { Suspense } from "react";

export function SuspenseWithDefaultFallback({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        {children}
      </Suspense>
    </div>
  );
}
