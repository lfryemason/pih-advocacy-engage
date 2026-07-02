"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRM_PHRASE = "delete this team";

type Props = {
  teamId: string;
  teamName: string;
  disabled?: boolean;
};

export function DeleteTeamButton({
  teamId,
  teamName,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText.trim() === CONFIRM_PHRASE && !isDeleting;

  async function handleConfirm() {
    if (!canConfirm) return;
    setError(null);
    setIsDeleting(true);
    try {
      const supabase = createClient();
      // team_memberships cascade on delete; meetings keep their rows but have
      // their primary_team_id set to null. Count guards against a silent no-op
      // if the row is blocked by RLS.
      const { error: deleteError, count } = await supabase
        .from("teams")
        .delete({ count: "exact" })
        .eq("id", teamId);
      if (deleteError) throw deleteError;
      if (!count) {
        throw new Error("You don't have permission to delete this team.");
      }
      router.replace("/teams");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete team");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Keep the dialog open while the delete is in flight so the user can't
        // dismiss the confirmation mid-request.
        if (isDeleting) return;
        setOpen(next);
        if (!next) {
          setConfirmText("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2
              size={18}
              className="shrink-0 text-destructive"
              aria-hidden="true"
            />
            Delete {teamName}?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the team and removes all of its members.
            Meetings linked to this team stay, but will no longer be associated
            with it. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="delete-team-confirm">
            Type{" "}
            <span className="font-semibold">
              &ldquo;{CONFIRM_PHRASE}&rdquo;
            </span>{" "}
            to continue.
          </Label>
          <Input
            id="delete-team-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            disabled={isDeleting}
          />
        </div>
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
            disabled={!canConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
