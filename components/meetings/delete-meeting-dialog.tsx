"use client";

import { useState } from "react";
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
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
  disabled?: boolean;
};

export function DeleteMeetingDialog({
  onConfirm,
  isDeleting,
  error,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);

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
        <Button type="button" variant="destructive" disabled={disabled}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this meeting?</DialogTitle>
          <DialogDescription>
            This permanently deletes the meeting and everyone in its delegation.
            This can&rsquo;t be undone.
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
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
