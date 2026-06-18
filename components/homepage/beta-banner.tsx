export function BetaBanner() {
  return (
    <div
      aria-label="Beta notice"
      className="w-full rounded-md border border-red-800 bg-red-100 px-6 py-3 text-sm text-red-950"
    >
      <strong className="text-lg font-semibold">Beta</strong>
      {" — "}This dashboard is in active development. You may encounter bugs or
      incomplete features.
    </div>
  );
}
