export function NameWithPronouns({
  name,
  pronouns,
}: {
  name: string;
  pronouns: string | null | undefined;
}) {
  return (
    <>
      {name}
      {pronouns && (
        <span className="ml-1 text-sm italic text-muted-foreground">
          {pronouns}
        </span>
      )}
    </>
  );
}
