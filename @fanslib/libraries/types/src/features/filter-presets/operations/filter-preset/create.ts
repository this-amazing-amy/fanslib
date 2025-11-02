import type { MediaFilters } from "../../../library/types";
import type { FilterPreset } from "../../filter-preset";

export type CreateFilterPresetRequest = {
  name: string;
  filters: MediaFilters;
};

export type CreateFilterPresetResponse = FilterPreset;

