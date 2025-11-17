import type { TagDimensionSchema } from "@fanslib/server/schemas";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup";
import {
  useCreateTagDefinitionMutation,
  useTagDefinitionsByDimensionQuery,
} from "~/lib/queries/tags";
import type { SelectionState } from "~/lib/tags/selection-state";
import { BooleanTagSelector } from "./BooleanTagSelector";
import { NumericalTagSelector } from "./NumericalTagSelector";
import { TagBadge } from "./TagBadge";

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
      handleCreateTag();
    } else if (e.key === "Escape") {
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
      <div className="flex flex-wrap gap-2 items-center">
        {isExclusive ? (
          <RadioGroup
            value={
              availableTags?.find((tag) => tagStates[tag.id] === "checked")?.id?.toString() ?? ""
            }
            onChange={(value) => {
              if (value) {
                const newTagId = parseInt(value);
                handleTagToggle(newTagId);
              }
            }}
            className="flex flex-wrap gap-2"
          >
            {availableTags?.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <RadioGroupItem value={tag.id.toString()} className="sr-only">
                  {tag.displayName}
                </RadioGroupItem>
                <TagBadge
                  tag={tag}
                  selectionState={tagStates[tag.id] ?? "unchecked"}
                  onClick={() => handleTagToggle(tag.id)}
                  selectionMode={isExclusive ? "radio" : "checkbox"}
                />
              </div>
            ))}
          </RadioGroup>
        ) : (
          // Checkbox behavior for non-exclusive dimensions
          availableTags?.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              selectionState={tagStates[tag.id] ?? "unchecked"}
              onClick={() => handleTagToggle(tag.id)}
              selectionMode="checkbox"
            />
          ))
        )}

        {dimension.dataType === "categorical" && (
          <>
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
                  className="h-8 w-8 p-0"
                  onPress={handleCreateTag}
                  isDisabled={!newTagValue.trim() || createTagMutation.isPending}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onPress={cancelCreating}>
                  <X className="w-3.5 h-3.5" />
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
          </>
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
