import type { MediaFilters, MediaSort, Media } from "../../media";

export type FindAdjacentMediaRequest = {
  filters?: MediaFilters;
  sort?: MediaSort;
};

export type FindAdjacentMediaResponse = {
  previous: Media | null;
  next: Media | null;
};
