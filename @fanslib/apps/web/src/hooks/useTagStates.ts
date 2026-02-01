import type { Media } from '@fanslib/server/schemas';
import { useMemo } from "react";
import { groupBy } from "remeda";
import { useBulkMediaTagsQuery } from "~/lib/queries/tags";
import type { SelectionState } from "~/lib/selection-state";


export type TagStates = Record<number, SelectionState>;

export type UseTagStatesResult = {
  tagStates: TagStates;
  isLoading: boolean;
  error: Error | null;
};

export const useTagStates = (selectedMedia: Media[]): UseTagStatesResult => {
  const mediaIds = selectedMedia.map((media) => media.id);
  const { data: allMediaTags, isLoading, error } = useBulkMediaTagsQuery(mediaIds);

  const tagStates = useMemo(() => {
    if (isLoading || !allMediaTags) {
      return {};
    }

    if (selectedMedia.length === 0) {
      return {};
    }

    const tagGroups = groupBy(allMediaTags, (mediaTag) => mediaTag?.tagDefinitionId.toString() ?? "");

    const states: TagStates = {};
    Object.entries(tagGroups).forEach(([tagIdStr, mediaTags]) => {
      const tagId = parseInt(tagIdStr, 10);
      const uniqueMediaIds = new Set(mediaTags.filter((mt): mt is NonNullable<typeof mt> => mt != null).map((mt) => mt.mediaId));

      if (uniqueMediaIds.size === 0) {
        // No media have this tag
        states[tagId] = "unchecked";
      } else if (uniqueMediaIds.size === selectedMedia.length) {
        // All selected media have this tag
        states[tagId] = "checked";
      } else {
        // Some but not all selected media have this tag
        states[tagId] = "indeterminate";
      }
    });

    return states;
  }, [allMediaTags, selectedMedia, isLoading]);

  return {
    tagStates,
    isLoading,
    error: error as Error | null,
  };
};
