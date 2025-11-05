import type { MediaFilters, MediaSort } from "@fanslib/types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { mergeDeep } from "remeda";
import type { DeepPartial } from "~/lib/deep-partial";

export type GridSize = "small" | "large";

type ViewPreferences = {
  gridSize: GridSize;
};

type SortPreferences = MediaSort;

type PaginationPreferences = {
  page: number;
  limit: number;
};

export type LibraryPreferences = {
  view: ViewPreferences;
  filter: MediaFilters;
  sort: SortPreferences;
  pagination: PaginationPreferences;
};

const defaultPreferences: LibraryPreferences = {
  view: {
    gridSize: "large",
  },
  filter: [],
  sort: {
    field: "fileModificationDate",
    direction: "DESC",
  },
  pagination: {
    page: 1,
    limit: 50,
  },
};

type LibraryPreferencesContextValue = {
  preferences: LibraryPreferences;
  updatePreferences: (updates: DeepPartial<LibraryPreferences>) => void;
};

const LibraryPreferencesContext = createContext<LibraryPreferencesContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "libraryPreferences";

export const LibraryPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<LibraryPreferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return mergeDeep(defaultPreferences, JSON.parse(stored));
    }
    return defaultPreferences;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = useCallback((updates: DeepPartial<LibraryPreferences>) => {
    setPreferences((prev) => mergeDeep(prev, updates) as LibraryPreferences);
  }, []);

  return (
    <LibraryPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </LibraryPreferencesContext.Provider>
  );
};

export const useLibraryPreferences = () => {
  const context = useContext(LibraryPreferencesContext);
  if (!context) {
    throw new Error("useLibraryPreferences must be used within a LibraryPreferencesProvider");
  }
  return context;
};
