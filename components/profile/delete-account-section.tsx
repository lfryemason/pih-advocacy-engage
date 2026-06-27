"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONFIRM_PHRASE = "DELETE";
export const REDIRECT_DELAY_MS = 3000;

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === CONFIRM_PHRASE;

  // Once the account is gone, return the user to the login page after a beat
  // so they can read the confirmation.
  useEffect(() => {
    if (!deleted) return;
    const id = setTimeout(() => router.push("/auth/login"), REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [deleted, router]);

  function handleOpenChange(next: boolean) {
    // Lock the dialog while deleting or after a successful deletion.
    if (isDeleting || deleted) return;
    setOpen(next);
    setConfirmText("");
    setError(null);
  }

  async function handleDelete() {
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("delete_own_account");
    if (rpcError) {
      setError(rpcError.message);
      setIsDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    setDeleted(true);
  }

  // Prevent dismissing the dialog mid-delete or once the account is gone.
  const lockDialog = isDeleting || deleted;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="mt-6">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn("sm:max-w-md", deleted && "border-destructive/50")}
        showCloseButton={!lockDialog}
        onEscapeKeyDown={(e) => lockDialog && e.preventDefault()}
        onPointerDownOutside={(e) => lockDialog && e.preventDefault()}
        onInteractOutside={(e) => lockDialog && e.preventDefault()}
      >
        {deleted ? (
          <DialogHeader>
            <DialogTitle className="text-destructive-dark">
              Your account has been deleted
            </DialogTitle>
            <DialogDescription>
              Your account and personal information have been permanently
              removed. Taking you back to the login page&hellip;
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This permanently deletes your account and removes you from your
                teams. You&apos;ll need a new invite link to return. Meeting
                records you&apos;ve logged will be kept.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-semibold">{CONFIRM_PHRASE}</span> to
                confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                aria-invalid={confirmText.length > 0 && !canDelete}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
