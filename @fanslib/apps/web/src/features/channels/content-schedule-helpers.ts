import type { MediaFilter } from '@fanslib/server/schemas';

type MediaFilters = MediaFilter;

export const parseMediaFilters = (mediaFilters?: string | null): MediaFilters | null => {
  if (!mediaFilters) return null;

  try {
    return JSON.parse(mediaFilters) as MediaFilters;
  } catch {
    return null;
  }
};

export const stringifyMediaFilters = (filters: MediaFilters): string => JSON.stringify(filters);
