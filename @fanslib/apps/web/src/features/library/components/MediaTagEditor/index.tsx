import type { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;
import { useTagStates } from "~/hooks/useTagStates";
import {
  useBulkAssignTagsMutation,
  useRemoveTagsFromMediaMutation,
  useTagDimensionsQuery,
} from "~/lib/queries/tags";
import type { SelectionState } from "~/lib/tags/selection-state";
import { DimensionTagSelector } from "./DimensionTagSelector";

type MediaTagEditorProps = {
  media: Media[]; // Always an array of media items
  className?: string;
};

export const MediaTagEditor = ({ media, className }: MediaTagEditorProps) => {
  const { data: dimensions } = useTagDimensionsQuery();
  const tagStates = useTagStates(media);
  const assignMutation = useBulkAssignTagsMutation();
  const removeMutation = useRemoveTagsFromMediaMutation();

  const handleTagToggle = async (tagId: number, currentState: SelectionState) => {
    if (currentState === "unchecked") {
      // Assign to all media
      const assignments = media.map((m) => ({
        mediaId: m.id,
        tagDefinitionIds: [tagId],
        source: "manual" as const,
      }));
      await assignMutation.mutateAsync(assignments);
    } else if (currentState === "checked") {
      // Remove from all media
      const removals = media.map((m) => ({
        mediaId: m.id,
        tagIds: [tagId],
      }));
      await Promise.all(removals.map(async (removal) => {
        await removeMutation.mutateAsync(removal);
      }));
    } else {
      // Indeterminate: assign to all media (making it consistent)
      const assignments = media.map((m) => ({
        mediaId: m.id,
        tagDefinitionIds: [tagId],
        source: "manual" as const,
      }));
      await assignMutation.mutateAsync(assignments);
    }

    // Clear any existing tags for this dimension
    // Find all tags in this dimension that are currently assigned
    if (dimensions && tagStates.tagStates) {
      // This is a simplified approach - in a real implementation, you'd want to
      // fetch tag definitions to know which tags belong to which dimension
      // For now, we'll skip the auto-removal to avoid complexity
    }
  };

  const isLoading = tagStates.isLoading;

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="flex gap-2">
              { }
              {Array.from({ length: 3 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={`tag-skeleton-${i}`} className="h-6 bg-gray-200 rounded-full w-16"></div>
              ))}
            </div>
          </div>
          { }
          {Array.from({ length: 2 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`section-skeleton-${i}`} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {dimensions?.map((dimension) => (
        <div key={dimension.id} className="pb-6 p-4">
          <span className="flex text-lg font-medium text-gray-900 mb-2">{dimension.name}</span>
          <DimensionTagSelector
            dimension={dimension}
            tagStates={tagStates.tagStates}
            onTagToggle={handleTagToggle}
          />
        </div>
      ))}
    </div>
  );
};
