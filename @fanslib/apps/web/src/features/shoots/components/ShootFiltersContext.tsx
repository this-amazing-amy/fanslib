import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import type { ShootFiltersSchema } from "@fanslib/server/schemas";

type ShootFilter = typeof ShootFiltersSchema.static;

export type ShootFilterItem =
  | { type: "search"; value: string }
  | { type: "dateRange"; value: { startDate: Date | undefined; endDate: Date | undefined } };

type ShootFiltersContextValue = {
  filters: ShootFilterItem[];
  addFilter: (type: ShootFilterItem["type"]) => void;
  updateFilter: (index: number, item: ShootFilterItem) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

const ShootFiltersContext = createContext<ShootFiltersContextValue | null>(null);

type ShootFiltersProviderProps = {
  value: ShootFilter;
  onChange: (filters: Partial<ShootFilter>) => void;
  children: ReactNode;
};

const filtersToItems = (filters: ShootFilter): ShootFilterItem[] => {
  const items: ShootFilterItem[] = [];

  if (filters.name) {
    items.push({ type: "search", value: filters.name });
  }
  if (filters.startDate || filters.endDate) {
    items.push({ type: "dateRange", value: { startDate: filters.startDate, endDate: filters.endDate } });
  }

  return items;
};

const itemsToFilters = (items: ShootFilterItem[]): Partial<ShootFilter> => {
  // Always explicitly set all filter fields to ensure removed filters are cleared
  const filters: Partial<ShootFilter> = {
    name: undefined,
    startDate: undefined,
    endDate: undefined,
  };

  items.forEach((item) => {
    if (item.type === "search") {
      // Only include search if it has a non-empty value
      if (item.value.trim()) {
        filters.name = item.value;
      }
    } else if (item.type === "dateRange") {
      filters.startDate = item.value.startDate;
      filters.endDate = item.value.endDate;
    }
  });

  return filters;
};

export const ShootFiltersProvider = ({ value, onChange, children }: ShootFiltersProviderProps) => {
  // Maintain items in local state to preserve empty filters in UI
  const [items, setItems] = useState<ShootFilterItem[]>(() => filtersToItems(value));
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
        return !item.value.startDate && !item.value.endDate;
      });
      return [...itemsFromValue, ...emptyItems];
    });
  }, [value]);

  const addFilter = (type: ShootFilterItem["type"]) => {
    const existingIndex = items.findIndex((f) => f.type === type);
    if (existingIndex >= 0) return; // Don't add duplicate filter types

    const newItem: ShootFilterItem =
      type === "search"
        ? { type: "search", value: "" }
        : { type: "dateRange", value: { startDate: undefined, endDate: undefined } };

    const newItems = [...items, newItem];
    setItems(newItems);
    isInternalUpdate.current = true;
    onChange(itemsToFilters(newItems));
  };

  const updateFilter = (index: number, item: ShootFilterItem) => {
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
    onChange({ name: undefined, startDate: undefined, endDate: undefined });
  };

  const hasActiveFilters = items.length > 0;

  const contextValue: ShootFiltersContextValue = {
    filters: items,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
  };

  return <ShootFiltersContext.Provider value={contextValue}>{children}</ShootFiltersContext.Provider>;
};

export const useShootFilters = () => {
  const context = useContext(ShootFiltersContext);
  if (!context) {
    throw new Error("useShootFilters must be used within a ShootFiltersProvider");
  }
  return context;
};

