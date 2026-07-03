"use client";

import { useEffect } from "react";
import { CHAMPION_LABELS } from "@/lib/meetings/meeting-roles";
import { SECTION_LABEL_CLASSNAME } from "@/lib/meetings/format";
import {
  LinkFormEntry,
  StafferOption,
  DelegationMember,
  LocalDelegationMember,
} from "@/lib/meetings/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { isDelegationMember } from "@/lib/meetings/permissions";
import { useStaffers } from "@/lib/meetings/use-staffers";
import { DelegationForm } from "@/components/meetings/delegation-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RepresentativeCombobox } from "@/components/meetings/create/representative-combobox";
import { TeamCombobox } from "@/components/meetings/create/team-combobox";
import { EditMeetingLinks } from "@/components/meetings/create/edit-meeting-links";
import { TimezoneSelect } from "@/components/meetings/create/timezone-select";
import { DeleteMeetingButton } from "@/components/meetings/delete-meeting-button";

export type FormState = {
  meetingDate: string;
  meetingTime: string;
  meetingTimezone: string;
  representativeId: string;
  congressionalContactId: string;
  primaryTeamId: string;
  location: string;
  notes: string;
  followUpDate: string;
  championScore: string;
};

type Props = {
  meetingId: string;
  form: FormState;
  onFormChange: (partial: Partial<FormState>) => void;
  links: LinkFormEntry[];
  onLinksChange: (links: LinkFormEntry[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDeleted: () => void;
  saveError: string | null;
  isSaving: boolean;
  delegationInitialMembers: DelegationMember[];
  onDelegationChange: (members: LocalDelegationMember[]) => void;
};

type ColumnProps = Props & { staffers: StafferOption[]; canDelete: boolean };

function LeftColumn({
  meetingId,
  form,
  onFormChange,
  links,
  staffers,
  onLinksChange,
}: ColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-1">
          <p className={SECTION_LABEL_CLASSNAME}>
            <Label htmlFor={`edit-rep-${meetingId}`}>Member of Congress</Label>
          </p>
          <span className="leading-none text-destructive" aria-hidden="true">
            *
          </span>
        </div>
        <RepresentativeCombobox
          id={`edit-rep-${meetingId}`}
          value={form.representativeId}
          onChange={(id) => {
            onFormChange({ representativeId: id, congressionalContactId: "" });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL_CLASSNAME}>
          <Label htmlFor={`edit-contact-${meetingId}`}>
            Congressional Contact
          </Label>
        </p>
        <Select
          id={`edit-contact-${meetingId}`}
          value={form.congressionalContactId}
          onChange={(e) =>
            onFormChange({ congressionalContactId: e.target.value })
          }
          disabled={!form.representativeId}
        >
          <option value="">Meeting with representative directly</option>
          {staffers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL_CLASSNAME}>
          <Label htmlFor={`edit-team-${meetingId}`}>Primary PIH Team</Label>
        </p>
        <TeamCombobox
          id={`edit-team-${meetingId}`}
          value={form.primaryTeamId}
          onChange={(id) => onFormChange({ primaryTeamId: id })}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className={SECTION_LABEL_CLASSNAME}>
            <Label htmlFor={`edit-champion-${meetingId}`}>Champion Score</Label>
          </p>
          <Select
            id={`edit-champion-${meetingId}`}
            value={form.championScore}
            onChange={(e) => onFormChange({ championScore: e.target.value })}
          >
            <option value="">—</option>
            {Object.entries(CHAMPION_LABELS).map(([score, label]) => (
              <option key={score} value={score}>
                {score} – {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className={SECTION_LABEL_CLASSNAME}>
            <Label htmlFor={`edit-followup-${meetingId}`}>Follow-up date</Label>
          </p>
          <Input
            id={`edit-followup-${meetingId}`}
            type="date"
            value={form.followUpDate}
            onChange={(e) => onFormChange({ followUpDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <p className={SECTION_LABEL_CLASSNAME}>
            <Label htmlFor={`edit-notes-${meetingId}`}>Notes</Label>
          </p>
          <span
            className={`text-xs ${form.notes.trim().length > 255 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {form.notes.trim().length}/255
          </span>
        </div>
        <Textarea
          id={`edit-notes-${meetingId}`}
          value={form.notes}
          onChange={(e) => onFormChange({ notes: e.target.value })}
          rows={3}
          aria-label="Notes"
        />
      </div>

      <EditMeetingLinks links={links} onChange={onLinksChange} />
    </div>
  );
}

function RightColumn({
  meetingId,
  canDelete,
  form,
  onFormChange,
  onCancel,
  onDeleted,
  saveError,
  isSaving,
  delegationInitialMembers,
  onDelegationChange,
}: ColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-baseline gap-1">
            <p className={SECTION_LABEL_CLASSNAME}>
              <Label htmlFor={`edit-date-${meetingId}`}>Date</Label>
            </p>
            <span className="leading-none text-destructive" aria-hidden="true">
              *
            </span>
          </div>
          <Input
            id={`edit-date-${meetingId}`}
            type="date"
            value={form.meetingDate}
            onChange={(e) => onFormChange({ meetingDate: e.target.value })}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className={SECTION_LABEL_CLASSNAME}>
            <Label htmlFor={`edit-time-${meetingId}`}>Time</Label>
          </p>
          <Input
            id={`edit-time-${meetingId}`}
            type="time"
            value={form.meetingTime}
            onChange={(e) => onFormChange({ meetingTime: e.target.value })}
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL_CLASSNAME}>
          <Label htmlFor={`edit-timezone-${meetingId}`}>Timezone</Label>
        </p>
        <TimezoneSelect
          id={`edit-timezone-${meetingId}`}
          value={form.meetingTimezone}
          onChange={(tz) => onFormChange({ meetingTimezone: tz })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL_CLASSNAME}>
          <Label htmlFor={`edit-location-${meetingId}`}>Location</Label>
        </p>
        <Input
          id={`edit-location-${meetingId}`}
          value={form.location}
          onChange={(e) => onFormChange({ location: e.target.value })}
          placeholder="e.g. 'Meeting Room 1, State House', or 'Virtual'"
        />
      </div>

      <DelegationForm
        initialMembers={delegationInitialMembers}
        onChange={onDelegationChange}
      />

      <div className="mt-auto pt-2">
        {saveError && (
          <p className="mb-2 text-sm text-destructive" role="alert">
            {saveError}
          </p>
        )}
        <div className="flex items-center gap-2">
          {canDelete && (
            <DeleteMeetingButton
              meetingId={meetingId}
              onDeleted={onDeleted}
              disabled={isSaving}
            />
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MeetingDetailEdit(props: Props) {
  const { form, onFormChange, delegationInitialMembers } = props;
  const { userId, isAdmin } = useCurrentUser();
  const staffers = useStaffers(form.representativeId);

  useEffect(() => {
    if (staffers.length === 0) return;
    if (form.congressionalContactId === "") return;
    if (!staffers.some((s) => s.id === form.congressionalContactId)) {
      onFormChange({ congressionalContactId: "" });
    }
  }, [staffers, form.congressionalContactId, onFormChange]);

  // Admins/super admins, or any current scheduling lead of this meeting, may
  // delete it — mirroring the RLS delete policy. The lead is whoever currently
  // holds that delegation role, so reassigning it hands off delete rights.
  const schedulingLeadIds = delegationInitialMembers
    .filter((member) => member.role === "scheduling_lead")
    .map((member) => member.user_id);
  const canDelete = isAdmin || isDelegationMember(userId, schedulingLeadIds);

  const columnProps: ColumnProps = { ...props, staffers, canDelete };

  return (
    <div className="p-4">
      <form onSubmit={props.onSubmit}>
        <div className="grid gap-6 @[600px]:grid-cols-2">
          <LeftColumn {...columnProps} />
          <RightColumn {...columnProps} />
        </div>
      </form>
    </div>
  );
}
