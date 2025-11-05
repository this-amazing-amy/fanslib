import type { PostStatus } from "@fanslib/types";
import { addMonths, startOfMonth } from "date-fns";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { mergeDeep } from "remeda";
import type { DeepPartial } from "~/lib/deep-partial";

export type PlanViewType = "timeline" | "calendar";

export type PlanFilterPreferences = {
  search?: string;
  channels?: string[];
  statuses?: PostStatus[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
};

export type PlanPreferences = {
  view: {
    viewType: PlanViewType;
    showCaptions: boolean;
  };
  filter: PlanFilterPreferences;
};

export const defaultPreferences: PlanPreferences = {
  view: {
    viewType: "timeline",
    showCaptions: false,
  },
  filter: {
    search: undefined,
    channels: undefined,
    statuses: undefined,
    dateRange: {
      startDate: startOfMonth(new Date()).toISOString(),
      endDate: addMonths(startOfMonth(new Date()), 3).toISOString(),
    },
  },
};

type PlanPreferencesContextValue = {
  preferences: PlanPreferences;
  updatePreferences: (updates: DeepPartial<PlanPreferences>) => void;
};

const PlanPreferencesContext = createContext<PlanPreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = "postPreferences";

export const PlanPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<PlanPreferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return mergeDeep(defaultPreferences, JSON.parse(stored));
    return defaultPreferences;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = useCallback((updates: DeepPartial<PlanPreferences>) => {
    setPreferences((prev) => mergeDeep(prev, updates) as PlanPreferences);
  }, []);

  return (
    <PlanPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </PlanPreferencesContext.Provider>
  );
};

export const usePlanPreferences = () => {
  const context = useContext(PlanPreferencesContext);
  if (!context) {
    throw new Error("usePlanPreferences must be used within a PlanPreferencesProvider");
  }
  return context;
};
