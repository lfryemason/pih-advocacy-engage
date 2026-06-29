const ROWS_PER_SECTION = 5;

function Bar({ className }: { className: string }) {
  return (
    <div
      data-slot="skeleton"
      className={`animate-pulse rounded-md bg-muted ${className}`}
    />
  );
}

function SectionSkeleton() {
  return (
    <div>
      <Bar className="mb-3 h-8 w-48" />
      <div className="flex flex-col gap-2 rounded-md border p-2">
        {Array.from({ length: ROWS_PER_SECTION }).map((_, i) => (
          <Bar key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function MeetingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Updating meetings"
      className="flex flex-col gap-10"
    >
      <span className="sr-only">Updating meetings…</span>
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
