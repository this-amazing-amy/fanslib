import type { TagDimensionSchema } from "@fanslib/server/schemas";
import { useTagDefinitionsByDimensionQuery } from "~/lib/queries/tags";
import type { SelectionState } from "~/lib/tags/selection-state";
import { BooleanTagSelector } from "./BooleanTagSelector";
import { HierarchicalTagSelector } from "./HierarchicalTagSelector";
import { NumericalTagSelector } from "./NumericalTagSelector";

type TagDimension = typeof TagDimensionSchema.static;

type DimensionTagSelectorProps = {
  dimension: TagDimension;
  tagStates: Record<number, SelectionState>;
  onTagToggle: (tagId: number, currentState: SelectionState) => void;
};

export const DimensionTagSelector = ({
  dimension,
  tagStates,
  onTagToggle,
}: DimensionTagSelectorProps) => {
  const { data: availableTags, isLoading } = useTagDefinitionsByDimensionQuery({
    dimensionId: dimension.id,
  });

  const handleTagToggle = (tagId: number) => {
    const currentState = tagStates[tagId] ?? "unchecked";

    if (dimension.isExclusive && currentState === "unchecked") {
      // For exclusive dimensions, first remove other selected tags
      const selectedTagsInDimension =
        availableTags
          ?.filter((tag) => tag.id !== tagId && tagStates[tag.id] === "checked")
          ?.map((tag) => tag.id) ?? [];

      if (selectedTagsInDimension.length > 0) {
        // Remove other tags first
        selectedTagsInDimension.forEach((otherTagId) => {
          onTagToggle(otherTagId, "checked");
        });
      }
    }

    onTagToggle(tagId, currentState);
  };

  if (dimension.dataType === "numerical") {
    return <NumericalTagSelector dimension={dimension} selectedTags={[]} onTagsChange={() => {}} />;
  }

  if (dimension.dataType === "boolean") {
    return <BooleanTagSelector dimension={dimension} selectedTags={[]} onTagsChange={() => {}} />;
  }

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <HierarchicalTagSelector
        tags={availableTags ?? []}
        tagStates={tagStates}
        onTagToggle={handleTagToggle}
      />
    </div>
  );
};
