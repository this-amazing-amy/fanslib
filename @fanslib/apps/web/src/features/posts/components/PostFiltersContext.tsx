import type { PostStatusSchema } from "@fanslib/server/schemas";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PostFilterPreferences } from "~/contexts/PostPreferencesContext";

type PostStatus = typeof PostStatusSchema.static;

export type PostFilterItem =
  | { type: "search"; value: string }
  | { type: "status"; value: PostStatus[] }
  | { type: "channel"; value: string[] };

type PostFiltersContextValue = {
  filters: PostFilterItem[];
  addFilter: (type: PostFilterItem["type"]) => void;
  updateFilter: (index: number, item: PostFilterItem) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

const PostFiltersContext = createContext<PostFiltersContextValue | null>(null);

type PostFiltersProviderProps = {
  value: PostFilterPreferences;
  onChange: (filters: Partial<PostFilterPreferences>) => void;
  children: ReactNode;
};

const filtersToItems = (filters: PostFilterPreferences): PostFilterItem[] => {
  const items: PostFilterItem[] = [];

  if (filters.search) {
    items.push({ type: "search", value: filters.search });
  }
  if (filters.statuses && filters.statuses.length > 0) {
    items.push({ type: "status", value: filters.statuses });
  }
  if (filters.channels && filters.channels.length > 0) {
    items.push({ type: "channel", value: filters.channels });
  }

  return items;
};

const itemsToFilters = (items: PostFilterItem[]): Partial<PostFilterPreferences> => {
  // Always explicitly set all filter fields to ensure removed filters are cleared
  const filters: Partial<PostFilterPreferences> = {
    search: undefined,
    statuses: undefined,
    channels: undefined,
  };

  items.forEach((item) => {
    if (item.type === "search") {
      // Only include search if it has a non-empty value
      if (item.value.trim()) {
        filters.search = item.value;
      }
    } else if (item.type === "status") {
      filters.statuses = item.value.length > 0 ? item.value : undefined;
    } else if (item.type === "channel") {
      filters.channels = item.value.length > 0 ? item.value : undefined;
    }
  });

  return filters;
};

export const PostFiltersProvider = ({ value, onChange, children }: PostFiltersProviderProps) => {
  // Maintain items in local state to preserve empty filters in UI
  const [items, setItems] = useState<PostFilterItem[]>(() => filtersToItems(value));
  const isInternalUpdate = useRef(false);

  // Sync items when value prop changes (from external updates only)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const itemsFromValue = filtersToItems(value);
    // Merge: keep empty items, update active items from value
    setItems((currentItems) => {
      const emptyItems = currentItems.filter((item) => {
        if (item.type === "search") return !item.value.trim();
        return item.value.length === 0;
      });
      return [...itemsFromValue, ...emptyItems];
    });
  }, [value]);

  const addFilter = (type: PostFilterItem["type"]) => {
    const existingIndex = items.findIndex((f) => f.type === type);
    if (existingIndex >= 0) return; // Don't add duplicate filter types

    const newItem: PostFilterItem =
      type === "search"
        ? { type: "search", value: "" }
        : type === "status"
          ? { type: "status", value: [] }
          : { type: "channel", value: [] };

    const newItems = [...items, newItem];
    setItems(newItems);
    isInternalUpdate.current = true;
    onChange(itemsToFilters(newItems));
  };

  const updateFilter = (index: number, item: PostFilterItem) => {
    const newItems = items.map((f, i) => (i === index ? item : f));
    setItems(newItems);
    isInternalUpdate.current = true;
    onChange(itemsToFilters(newItems));
  };

  const removeFilter = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    isInternalUpdate.current = true;
    onChange(itemsToFilters(newItems));
  };

  const clearFilters = () => {
    setItems([]);
    isInternalUpdate.current = true;
    onChange({ search: undefined, channels: undefined, statuses: undefined });
  };

  const hasActiveFilters = items.length > 0;

  const contextValue: PostFiltersContextValue = {
    filters: items,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
  };

  return <PostFiltersContext.Provider value={contextValue}>{children}</PostFiltersContext.Provider>;
};

export const usePostFilters = () => {
  const context = useContext(PostFiltersContext);
  if (!context) {
    throw new Error("usePostFilters must be used within a PostFiltersProvider");
  }
  return context;
};

