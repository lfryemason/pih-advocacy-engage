"use client";

import { EMPTY_LOCATION, type MeetingLocation } from "@/lib/meetings/types";
import { useMeetingBuildings } from "@/lib/meetings/use-meeting-buildings";
import { US_STATES } from "@/lib/us-districts";
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
  const buildings = useMeetingBuildings();
  const set = (patch: Partial<MeetingLocation>) =>
    onChange({ ...value, ...patch });
  const buildingListId = `${idPrefix}-building-list`;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm">
        <Checkbox
          checked={value.isVirtual}
          onCheckedChange={(checked) =>
            // Toggling on clears any physical address; toggling off starts blank.
            onChange(
              checked === true
                ? { ...EMPTY_LOCATION, isVirtual: true }
                : { ...EMPTY_LOCATION, isVirtual: false },
            )
          }
        />
        Virtual meeting
      </label>

      {!value.isVirtual && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-building`}>Building</Label>
            <Input
              id={`${idPrefix}-building`}
              list={buildingListId}
              value={value.building}
              onChange={(e) => set({ building: e.target.value })}
              placeholder="e.g. Hart Senate Office Building"
            />
            <datalist id={buildingListId}>
              {buildings.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
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
