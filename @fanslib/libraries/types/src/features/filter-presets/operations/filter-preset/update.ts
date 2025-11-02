import type { MediaFilters } from "../../../library/types";
import type { FilterPreset } from "../../filter-preset";

export type UpdateFilterPresetRequest = {
  name?: string;
  filters?: MediaFilters;
};

export type UpdateFilterPresetResponse = FilterPreset | null;

