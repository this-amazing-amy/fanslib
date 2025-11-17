import type { PostStatusSchema } from "@fanslib/server/schemas";
import { addMonths, startOfMonth } from "date-fns";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { mergeDeep } from "remeda";
import type { DeepPartial } from "~/lib/deep-partial";

type PostStatus = typeof PostStatusSchema.static;

export type PostViewType = "timeline" | "calendar";

export type PostFilterPreferences = {
  search?: string;
  channels?: string[];
  statuses?: PostStatus[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
};

export type PostPreferences = {
  view: {
    viewType: PostViewType;
    showCaptions: boolean;
  };
  filter: PostFilterPreferences;
};

export const defaultPreferences: PostPreferences = {
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

type PostPreferencesContextValue = {
  preferences: PostPreferences;
  updatePreferences: (updates: DeepPartial<PostPreferences>) => void;
};

const PostPreferencesContext = createContext<PostPreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = "postPreferences";

export const PostPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<PostPreferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return mergeDeep(defaultPreferences, JSON.parse(stored));
    return defaultPreferences;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = useCallback((updates: DeepPartial<PostPreferences>) => {
    setPreferences((prev) => mergeDeep(prev, updates) as PostPreferences);
  }, []);

  return (
    <PostPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </PostPreferencesContext.Provider>
  );
};

export const usePostPreferences = () => {
  const context = useContext(PostPreferencesContext);
  if (!context) {
    throw new Error("usePostPreferences must be used within a PostPreferencesProvider");
  }
  return context;
};
