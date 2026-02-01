import type { PostStatus } from '@fanslib/server/schemas';
import { addMonths, startOfMonth } from "date-fns";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { mergeDeep } from "remeda";
import type { DeepPartial } from "~/lib/deep-partial";
import type { PostTypeFilter } from "~/lib/virtual-posts";


export type PostViewType = "timeline" | "calendar" | "swimlane";

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
    openDialogOnDrop: boolean;
    autoDraftBlueskyOnDrop: boolean;
    postTypeFilter: PostTypeFilter;
    swimlane?: {
      channelOrder?: string[];
      hiddenChannels?: string[];
    };
  };
  filter: PostFilterPreferences;
};

export const defaultPreferences: PostPreferences = {
  view: {
    viewType: "timeline",
    showCaptions: false,
    openDialogOnDrop: true,
    autoDraftBlueskyOnDrop: true,
    postTypeFilter: "both",
    swimlane: {
      channelOrder: undefined,
      hiddenChannels: [],
    },
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
  // Always start with defaultPreferences to ensure SSR/client hydration match
  const [preferences, setPreferences] = useState<PostPreferences>(defaultPreferences);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage after mount (after hydration)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(mergeDeep(defaultPreferences, parsed) as PostPreferences);
      } catch (error) {
        console.error("Failed to parse stored preferences:", error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage after hydration
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, isHydrated]);

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
