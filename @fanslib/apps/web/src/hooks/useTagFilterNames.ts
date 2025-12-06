import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { useTagDefinitionsByIdsQuery } from "~/lib/queries/tags";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];

const extractTagIds = (filterGroups: MediaFilters): number[] => {
  return filterGroups.flatMap((group) =>
    group.items
      .filter((item): item is Extract<FilterItem, { type: "tag" }> => item.type === "tag")
      .map((item) => Number(item.id))
      .filter((id) => !isNaN(id))
  );
};

const createTagNameMap = (tagDefinitions?: Array<{ id: number; displayName: string }>): Map<string, string> => {
  return tagDefinitions
    ? new Map(tagDefinitions.map((tag) => [String(tag.id), tag.displayName]))
    : new Map();
};

export const useTagFilterNames = (filterGroups: MediaFilters) => {
  const tagIds = extractTagIds(filterGroups);
  const { data: tagDefinitions } = useTagDefinitionsByIdsQuery({ ids: tagIds });
  const tagNameMap = createTagNameMap(tagDefinitions);
  
  return tagNameMap;
};
