"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Settings } from "lucide-react";
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
      <div className="rounded-lg border p-4">
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
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">
              {staffer.first_name} {staffer.last_name}
            </span>
            {staffer.pronouns && (
              <span className="text-sm text-muted-foreground">
                ({staffer.pronouns})
              </span>
            )}
          </div>
          {staffer.title && (
            <p className="mt-0.5 text-sm text-primary">{staffer.title}</p>
          )}
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {staffer.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0" aria-hidden="true" />
                {staffer.location}
              </span>
            )}
            {staffer.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${staffer.email}`}
                  className="text-primary hover:underline"
                >
                  {staffer.email}
                </a>
              </span>
            )}
            {staffer.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} className="shrink-0" aria-hidden="true" />
                <a href={`tel:${staffer.phone}`} className="hover:underline">
                  {staffer.phone}
                </a>
              </span>
            )}
            {staffer.linkedin_url && (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-[13px] w-[13px] shrink-0"
                  aria-hidden="true"
                />
                <a
                  href={staffer.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn profile
                </a>
              </span>
            )}
          </div>
          {staffer.notes && (
            <details className="mt-3 text-sm">
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
      </div>
    </div>
  );
}
