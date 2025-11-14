import type { MediaFilters } from "@fanslib/types";

export const parseMediaFilters = (mediaFilters?: string): MediaFilters | null => {
  if (!mediaFilters) return null;

  try {
    return JSON.parse(mediaFilters) as MediaFilters;
  } catch {
    return null;
  }
};

export const stringifyMediaFilters = (filters: MediaFilters): string => JSON.stringify(filters);
