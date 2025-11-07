import type { Media } from "../../media";
import type { MediaFilters } from "../../filters";
import type { MediaSort } from "../../sort";

export type FindAdjacentMediaRequest = {
  filters?: MediaFilters;
  sort?: MediaSort;
};

export type FindAdjacentMediaResponse = {
  previous: Media | null;
  next: Media | null;
};
