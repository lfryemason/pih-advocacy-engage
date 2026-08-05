"use client";

import type { MeetingLocation } from "@/lib/meetings/types";
import { US_STATES } from "@/lib/us-districts";
import { BuildingSelect } from "@/components/meetings/create/building-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function LocationFields({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: MeetingLocation;
  onChange: (next: MeetingLocation) => void;
}) {
  const set = (patch: Partial<MeetingLocation>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm">
        <Checkbox
          checked={value.isVirtual}
          onCheckedChange={(checked) =>
            // Leave the address fields as-is; they're discarded on save (see
            // normalizeLocationForSave) rather than here, so an accidental
            // double-toggle doesn't wipe out an in-progress or existing address.
            set({ isVirtual: checked === true })
          }
        />
        Virtual meeting
      </label>

      {!value.isVirtual && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-building`}>Building</Label>
            <BuildingSelect
              id={`${idPrefix}-building`}
              value={value.building}
              onChange={(building) => set({ building })}
              placeholder="e.g. Hart Senate Office Building"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-room`}>Room</Label>
            <Input
              id={`${idPrefix}-room`}
              value={value.room}
              onChange={(e) => set({ room: e.target.value })}
              placeholder="e.g. 509"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-city`}>City</Label>
            <Input
              id={`${idPrefix}-city`}
              value={value.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-state`}>State</Label>
            <Select
              id={`${idPrefix}-state`}
              value={value.state}
              onChange={(e) => set({ state: e.target.value })}
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
