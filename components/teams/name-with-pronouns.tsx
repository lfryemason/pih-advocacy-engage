import { Pronouns } from "@/components/pronouns";

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
        <span className="ml-1">
          <Pronouns pronouns={pronouns} />
        </span>
      )}
    </>
  );
}
