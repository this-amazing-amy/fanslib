import type { MediaFilter, MediaSort } from '@fanslib/server/schemas';
import { createContext, useCallback, useContext } from "react";
import { mergeDeep } from "remeda";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import type { DeepPartial } from "~/lib/deep-partial";

type MediaFilters = MediaFilter;

export type GridSize = "small" | "large";

type ViewPreferences = {
  gridSize: GridSize;
  filtersCollapsed: boolean;
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
    filtersCollapsed: false,
  },
  filter: [],
  sort: {
    field: "fileCreationDate",
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

type LibraryPreferencesProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

export const LibraryPreferencesProvider = ({
  children,
  storageKey,
}: LibraryPreferencesProviderProps) => {
  const { value: preferences, setValue: setPreferences } = useLocalStorage(
    storageKey ?? STORAGE_KEY,
    defaultPreferences,
    (defaults, stored) => mergeDeep(defaults, stored)
  );

  const updatePreferences = useCallback((updates: DeepPartial<LibraryPreferences>) => {
    const newPreferences = mergeDeep(preferences, updates) as LibraryPreferences;
    setPreferences(newPreferences);
  }, [setPreferences, preferences]);

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
