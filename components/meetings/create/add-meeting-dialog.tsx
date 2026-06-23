"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createMeeting } from "@/lib/meetings/queries";
import { CreateMeetingValues, LinkFormEntry } from "@/lib/meetings/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateMeetingForm } from "@/components/meetings/create/create-meeting-form";

export function AddMeetingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(
    values: CreateMeetingValues,
    links: LinkFormEntry[],
    primaryTeamName: string | null,
  ) {
    const supabase = createClient();
    await createMeeting(supabase, values, links, primaryTeamName);
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Meeting
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Add Meeting</DialogTitle>
        </DialogHeader>
        <CreateMeetingForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
