import type { TagDimensionSchema } from "@fanslib/server/schemas";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { getRandomPresetId } from "~/lib/colors";
import {
  useCreateTagDefinitionMutation,
  useTagDefinitionsByDimensionQuery,
} from "~/lib/queries/tags";
import type { SelectionState } from "~/lib/tags/selection-state";
import { BooleanTagSelector } from "./BooleanTagSelector";
import { FlatTagSelector } from "./FlatTagSelector";
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
  const [isCreating, setIsCreating] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");

  const { data: availableTags, isLoading, refetch } = useTagDefinitionsByDimensionQuery({ dimensionId: dimension.id });
  const createTagMutation = useCreateTagDefinitionMutation();

  const isExclusive = dimension.isExclusive;

  const handleTagToggle = (tagId: number) => {
    const currentState = tagStates[tagId] ?? "unchecked";

    if (isExclusive && currentState === "unchecked") {
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

    // Then toggle the clicked tag
    onTagToggle(tagId, currentState);
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewTagValue("");
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTagValue("");
  };

  const handleCreateTag = async () => {
    if (!newTagValue.trim()) return;

    try {
      const newTag = await createTagMutation.mutateAsync({
        dimensionId: dimension.id,
        value: newTagValue.trim(),
        displayName: newTagValue.trim(),
        description: `${dimension.name}: ${newTagValue.trim()}`,
        color: getRandomPresetId(),
      });

      await refetch();
      setIsCreating(false);
      setNewTagValue("");

      // Auto-select the newly created tag
      if (newTag) {
        setTimeout(() => {
          onTagToggle(newTag.id, "unchecked");
        }, 100);
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelCreating();
    }
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
    <div>
      <div className="flex flex-col gap-2">
        {isExclusive ? (
          <FlatTagSelector
            tags={availableTags ?? []}
            tagStates={tagStates}
            onTagToggle={handleTagToggle}
          />
        ) : (
          <HierarchicalTagSelector
            tags={availableTags ?? []}
            tagStates={tagStates}
            onTagToggle={handleTagToggle}
          />
        )}

        {dimension.dataType === "categorical" && (
          <div className="flex items-center gap-2">
            {isCreating ? (
              <>
                <Input
                  value={newTagValue}
                  onChange={(value) => setNewTagValue(value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`New ${dimension.name.toLowerCase()}...`}
                  className="h-8 text-sm w-40"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onPress={cancelCreating}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-none rounded-full shadow-none"
                onClick={startCreating}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {createTagMutation.isPending && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          Creating tag...
        </div>
      )}
    </div>
  );
};
