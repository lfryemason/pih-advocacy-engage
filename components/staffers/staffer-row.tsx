"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { StafferForm } from "@/components/staffers/staffer-form";

type Staffer = Tables<"staffers">;

export function StafferRow({
  staffer,
  canDelete,
  orgId,
}: {
  staffer: Staffer;
  canDelete: boolean;
  orgId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete ${staffer.first_name} ${staffer.last_name}?`)) return;
    const supabase = createClient();
    setIsDeleting(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from("staffers")
      .delete()
      .eq("id", staffer.id);
    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }
    router.refresh();
  };

  if (isEditing) {
    return (
      <li className="p-4">
        <StafferForm
          representativeId={staffer.representative_id}
          orgId={orgId}
          staffer={staffer}
          onDone={() => {
            setIsEditing(false);
            router.refresh();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-bold">
            {staffer.first_name} {staffer.last_name}
          </span>
          {staffer.pronouns && (
            <span className="text-sm text-muted-foreground">
              ({staffer.pronouns})
            </span>
          )}
          {staffer.title && (
            <>
              <span
                className="text-sm text-muted-foreground"
                aria-hidden="true"
              >
                &bull;
              </span>
              <span className="text-sm text-muted-foreground">
                {staffer.title}
              </span>
            </>
          )}
        </div>
        {staffer.email && (
          <p className="mt-1 text-sm text-muted-foreground">{staffer.email}</p>
        )}
        {staffer.notes && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Notes
            </summary>
            <div className="prose prose-sm mt-1 max-w-none rounded border p-2 text-foreground dark:prose-invert prose-headings:my-1 prose-p:my-0 prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:my-2 prose-pre:bg-muted">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                disallowedElements={["img"]}
              >
                {staffer.notes}
              </ReactMarkdown>
            </div>
          </details>
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
          aria-label="Edit staffer"
        >
          <Settings />
        </Button>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </li>
  );
}
