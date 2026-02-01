import type { FilterPreset, MediaFilter } from '@fanslib/server/schemas';
import { createContext, useContext, type ReactNode } from "react";
import {
  useCreateFilterPresetMutation,
  useDeleteFilterPresetMutation,
  useFilterPresetsQuery,
  useUpdateFilterPresetMutation,
} from "~/lib/queries/filter-presets";


type MediaFilters = MediaFilter;

type FilterPresetContextValue = {
  presets: FilterPreset[];
  isLoading: boolean;

  createPreset: (name: string, filters: MediaFilters) => Promise<void>;
  updatePreset: (id: string, name?: string, filters?: MediaFilters) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  applyPreset: (filters: MediaFilters) => void;
};

const FilterPresetContext = createContext<FilterPresetContextValue | null>(null);

type FilterPresetProviderProps = {
  children: ReactNode;
  onFiltersChange: (filters: MediaFilters) => void;
};

export const FilterPresetProvider = ({ children, onFiltersChange }: FilterPresetProviderProps) => {
  const { data: presets = [], isLoading } = useFilterPresetsQuery();
  const createMutation = useCreateFilterPresetMutation();
  const updateMutation = useUpdateFilterPresetMutation();
  const deleteMutation = useDeleteFilterPresetMutation();

  const createPreset = async (name: string, filters: MediaFilters) => {
    await createMutation.mutateAsync({ name, filters });
  };

  const updatePreset = async (id: string, name?: string, filters?: MediaFilters) => {
    const updates: { name?: string; filters?: MediaFilters } = {};
    if (name !== undefined) updates.name = name;
    if (filters !== undefined) updates.filters = filters;

    await updateMutation.mutateAsync({ id, updates });
  };

  const deletePreset = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const contextValue: FilterPresetContextValue = {
    presets: (presets ?? []) as unknown as FilterPreset[],
    isLoading,

    createPreset,
    updatePreset,
    deletePreset,
    applyPreset: onFiltersChange,
  };

  return (
    <FilterPresetContext.Provider value={contextValue}>{children}</FilterPresetContext.Provider>
  );
};

export const useFilterPresetContext = () => {
  const context = useContext(FilterPresetContext);
  if (!context) {
    throw new Error("useFilterPresetContext must be used within a FilterPresetProvider");
  }
  return context;
};
