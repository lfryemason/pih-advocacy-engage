"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  convertMeetingDateTime,
  resolveDisplayTimezone,
  type TimeDisplayPreference,
} from "@/lib/meetings/format";

const STORAGE_KEY = "meeting-time-display-preference";

const PROVIDER_DEFAULT_PREFERENCE: TimeDisplayPreference = "eastern";

const UNPROVIDED_DEFAULT_PREFERENCE: TimeDisplayPreference = "specified";

function isTimeDisplayPreference(
  value: string | null,
): value is TimeDisplayPreference {
  return value === "current" || value === "eastern" || value === "specified";
}

type TimeDisplayPreferenceContextValue = {
  preference: TimeDisplayPreference;
  setPreference: (preference: TimeDisplayPreference) => void;
  hasProvider: boolean;
};

const TimeDisplayPreferenceContext =
  createContext<TimeDisplayPreferenceContextValue>({
    preference: UNPROVIDED_DEFAULT_PREFERENCE,
    setPreference: () => {},
    hasProvider: false,
  });

export function TimeDisplayPreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preference, setPreferenceState] = useState<TimeDisplayPreference>(
    PROVIDER_DEFAULT_PREFERENCE,
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTimeDisplayPreference(stored)) setPreferenceState(stored);
  }, []);

  const setPreference = useCallback((next: TimeDisplayPreference) => {
    setPreferenceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <TimeDisplayPreferenceContext.Provider
      value={{ preference, setPreference, hasProvider: true }}
    >
      {children}
    </TimeDisplayPreferenceContext.Provider>
  );
}

export function useTimeDisplayPreference() {
  return useContext(TimeDisplayPreferenceContext);
}

export function useMeetingDisplayDateTime(
  meetingDate: string,
  meetingTime: string | null,
  meetingTimezone: string,
): { date: string; time: string | null; timezone: string } {
  const { preference } = useTimeDisplayPreference();
  const timezone = resolveDisplayTimezone(preference, meetingTimezone);

  if (!meetingTime) return { date: meetingDate, time: null, timezone };

  const { date, time } = convertMeetingDateTime(
    meetingDate,
    meetingTime,
    meetingTimezone,
    timezone,
  );
  return { date, time, timezone };
}
