export function Pronouns({
  pronouns,
}: {
  pronouns: string | null | undefined;
}) {
  if (!pronouns) return null;
  return <span className="text-sm text-muted-foreground">{pronouns}</span>;
}
