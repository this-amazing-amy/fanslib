import type { MediaFilterSchema } from "@fanslib/server/schemas";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import {
  addFilterItemToGroup,
  isFilterGroupEmpty,
  removeFilterItemFromGroup,
  updateFilterItemInGroup,
} from "~/features/library/filter-helpers";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

type MediaFiltersContextValue = {
  // State
  filters: MediaFilters;

  // Actions
  onChange: (filters: MediaFilters) => void;
  removeGroup: (groupIndex: number) => void;
  updateGroupInclude: (groupIndex: number, include: boolean) => void;
  addGroupWithFilterType: (filterType: FilterItem["type"]) => void;
  addEmptyGroup: () => void;
  addFilterToGroup: (groupIndex: number, item: FilterItem) => void;
  addFilterWithTypeToGroup: (groupIndex: number, filterType: FilterItem["type"]) => void;
  updateFilterInGroup: (groupIndex: number, itemIndex: number, item: FilterItem) => void;
  removeFilterFromGroup: (groupIndex: number, itemIndex: number) => void;
  clearFilters: () => void;

  // Computed
  hasActiveFilters: boolean;
  isHydrated: boolean;
};

const MediaFiltersContext = createContext<MediaFiltersContextValue | null>(null);

type MediaFiltersProviderProps = {
  value: MediaFilters;
  onChange: (filters: MediaFilters) => void;
  isHydrated: boolean;
  children: ReactNode;
};

const normalizeFilters = (value: unknown): MediaFilters => {
  if (!Array.isArray(value)) return [];

  return value.filter((group): group is FilterGroup => group && typeof group === "object");
};

export const MediaFiltersProvider = ({ value, onChange, isHydrated, children }: MediaFiltersProviderProps) => {
  const filters = normalizeFilters(value);

  const hasActiveFilters = filters.length > 0 && filters.some((group) => group.items.length > 0);

  const addGroupWithFilterType = (filterType: FilterItem["type"]) => {
    // eslint-disable-next-line functional/no-let
    let defaultItem: FilterItem;

    switch (filterType) {
      case "channel":
      case "subreddit":
      case "tag":
      case "shoot":
        defaultItem = { type: filterType, id: "" };
        break;
      case "filename":
      case "caption":
        defaultItem = { type: filterType, value: "" };
        break;
      case "posted":
        defaultItem = { type: filterType, value: false };
        break;
      case "mediaType":
        defaultItem = { type: filterType, value: "image" };
        break;
      case "createdDateStart":
      case "createdDateEnd":
        defaultItem = { type: filterType, value: new Date() };
        break;
      case "dimensionEmpty":
        defaultItem = { type: filterType, dimensionId: 0 };
        break;
      default:
        defaultItem = { type: "filename", value: "" };
    }

    console.log("defaultItem", defaultItem);

    onChange([
      ...filters,
      {
        include: true,
        items: [defaultItem],
      },
    ]);
  };

  const addEmptyGroup = () => {
    onChange([...filters, { include: true, items: [] }]);
  };

  const removeGroup = (groupIndex: number) => {
    const newFilters = filters.filter((_, index) => index !== groupIndex);
    onChange(newFilters);
  };

  const updateGroupInclude = (groupIndex: number, include: boolean) => {
    const newFilters = filters.map((group, index) =>
      index === groupIndex ? { ...group, include } : group
    );
    onChange(newFilters);
  };

  const addFilterToGroup = (groupIndex: number, item: FilterItem) => {
    const newFilters = [...filters];
    if (!filters[groupIndex]) return;
    const updatedGroup = addFilterItemToGroup(filters[groupIndex], item);
    newFilters[groupIndex] = updatedGroup;
    console.log("newFilters", newFilters);
    onChange(newFilters);
  };

  const addFilterWithTypeToGroup = (groupIndex: number, filterType: FilterItem["type"]) => {
    // Create a default filter item based on the type
    // eslint-disable-next-line functional/no-let
    let defaultItem: FilterItem;

    switch (filterType) {
      case "channel":
      case "subreddit":
      case "tag":
      case "shoot":
        defaultItem = { type: filterType, id: "" };
        break;
      case "filename":
      case "caption":
        defaultItem = { type: filterType, value: "" };
        break;
      case "posted":
        defaultItem = { type: filterType, value: false };
        break;
      case "mediaType":
        defaultItem = { type: filterType, value: "image" };
        break;
      case "createdDateStart":
      case "createdDateEnd":
        defaultItem = { type: filterType, value: new Date() };
        break;
      case "dimensionEmpty":
        defaultItem = { type: filterType, dimensionId: 0 };
        break;
      default:
        defaultItem = { type: "filename", value: "" };
    }

    addFilterToGroup(groupIndex, defaultItem);
  };

  const updateFilterInGroup = (groupIndex: number, itemIndex: number, item: FilterItem) => {
    const newFilters = [...filters];
    if (!filters[groupIndex]) return;
    const updatedGroup = updateFilterItemInGroup(filters[groupIndex], itemIndex, item);
    newFilters[groupIndex] = updatedGroup;
    onChange(newFilters);
  };

  const removeFilterFromGroup = (groupIndex: number, itemIndex: number) => {
    if (!filters[groupIndex]) return;
    const updatedGroup = removeFilterItemFromGroup(filters[groupIndex], itemIndex);
    if (isFilterGroupEmpty(updatedGroup)) {
      onChange(filters.filter((_, index) => index !== groupIndex));
      return;
    }
    onChange(
      filters.map((group, index) => (index === groupIndex ? updatedGroup : group))
    );
  };

  const clearFilters = () => {
    onChange([]);
  };

  const contextValue: MediaFiltersContextValue = {
    // State
    filters,

    // Actions
    onChange,
    addGroupWithFilterType,
    addEmptyGroup,
    removeGroup,
    updateGroupInclude,
    addFilterToGroup,
    addFilterWithTypeToGroup,
    updateFilterInGroup,
    removeFilterFromGroup,
    clearFilters,

    // Computed
    hasActiveFilters,
    isHydrated,
  };

  return (
    <MediaFiltersContext.Provider value={contextValue}>{children}</MediaFiltersContext.Provider>
  );
};

export const useMediaFilters = () => {
  const context = useContext(MediaFiltersContext);
  if (!context) {
    throw new Error("useMediaFilters must be used within a MediaFiltersProvider");
  }
  return context;
};
