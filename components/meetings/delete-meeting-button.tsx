"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteMeeting } from "@/lib/meetings/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  meetingId: string;
  onDeleted: () => void;
  disabled?: boolean;
};

export function DeleteMeetingButton({
  meetingId,
  onDeleted,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsDeleting(true);
    try {
      const supabase = createClient();
      await deleteMeeting(supabase, meetingId);
      // The refreshed list no longer includes this meeting, so this row (and
      // therefore this component) unmounts. Leave isDeleting true through the
      // unmount rather than flashing the button back to its default label.
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete meeting");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Keep the dialog open while the delete is in flight so the user can't
        // dismiss the confirmation mid-request.
        if (!isDeleting) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-destructive-light dark:hover:text-destructive-light"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this meeting?</DialogTitle>
          <DialogDescription>
            This permanently deletes the meeting and removes everyone from the
            delegation. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
