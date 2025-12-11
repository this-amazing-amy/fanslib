import type { FilterItemTagSchema, MediaFilterSchema } from "@fanslib/server/schemas";
import { useTagDefinitionsByIdsQuery } from "~/lib/queries/tags";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterItemTag = typeof FilterItemTagSchema.static;

const extractTagIds = (filterGroups: MediaFilters): number[] => filterGroups.flatMap((group) =>
    group.items
      .filter((item): item is FilterItemTag => item.type === 'tag')
      .map((item) => Number(item.id))
      .filter((id) => !isNaN(id))
  );

const createTagNameMap = (tagDefinitions?: Array<{ id: number; displayName: string }>): Map<string, string> => tagDefinitions
    ? new Map(tagDefinitions.map((tag) => [String(tag.id), tag.displayName]))
    : new Map();

export const useTagFilterNames = (filterGroups: MediaFilters) => {
  const tagIds = extractTagIds(filterGroups);
  const { data: tagDefinitions } = useTagDefinitionsByIdsQuery({ ids: tagIds });
  if (!tagDefinitions) {
    return new Map<string, string>();
  }
  const tagNameMap = createTagNameMap(tagDefinitions);
  
  return tagNameMap;
};
