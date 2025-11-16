import { List, Plus, TreePine } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { TagDragProvider } from "~/contexts/TagDragContext";
import {
  useCreateTagDefinitionMutation,
  useCreateTagDimensionMutation,
  useDeleteTagDefinitionMutation,
  useDeleteTagDimensionMutation,
  useTagDimensionsQuery,
  useUpdateTagDefinitionMutation,
  useUpdateTagDimensionMutation,
} from "~/lib/queries/tags";
import type {
  CreateTagDefinitionRequestBodySchema,
  CreateTagDimensionRequestBodySchema,
  UpdateTagDimensionRequestBodySchema,
} from "@fanslib/server/schemas";
import { DimensionCard } from "./DimensionCard";
import { DimensionDialog, type EditingDimension } from "./DimensionDialog";
import { DeleteTagDialog } from "./DeleteTagDialog";
import { TagDialog, type EditingTag } from "./TagDialog";

export const TagDimensionsTab = () => {
  const [editingDimension, setEditingDimension] = useState<EditingDimension | null>(null);
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "tree">("tree");
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  const { data: dimensions, isPending: isLoading } = useTagDimensionsQuery();
  const createDimensionMutation = useCreateTagDimensionMutation();
  const updateDimensionMutation = useUpdateTagDimensionMutation();
  const createTagMutation = useCreateTagDefinitionMutation();
  const updateTagMutation = useUpdateTagDefinitionMutation();
  const deleteDimensionMutation = useDeleteTagDimensionMutation();
  const deleteTagMutation = useDeleteTagDefinitionMutation();

  const handleDimensionSubmit = (
    data:
      | typeof CreateTagDimensionRequestBodySchema.static
      | { id: number; updates: typeof UpdateTagDimensionRequestBodySchema.static }
  ) => {
    if ("id" in data) {
      updateDimensionMutation.mutate(data, {
        onSuccess: () => setEditingDimension(null),
      });
    } else {
      createDimensionMutation.mutate(data, {
        onSuccess: () => setEditingDimension(null),
      });
    }
  };

  const handleTagSubmit = (data: typeof CreateTagDefinitionRequestBodySchema.static | { id: number; updates: any }) => {
    if ("id" in data) {
      updateTagMutation.mutate(data, {
        onSuccess: () => setEditingTag(null),
      });
    } else {
      createTagMutation.mutate(data, {
        onSuccess: () => setEditingTag(null),
      });
    }
  };

  const handleCreateTag = (dimensionId: number, parentTagId?: number) => {
    setEditingTag({
      parentTagId,
      dimensionId,
      mode: "create",
    });
  };

  const handleEditTag = (tag: any) => {
    setEditingTag({
      tag,
      mode: "edit",
    });
  };

  const handleEditDimension = (dimension: any) => {
    setEditingDimension({
      dimension,
      mode: "edit",
    });
  };

  const handleUpdateParent = (tagId: number, newParentId: number | null) => {
    const tag = dimensions?.flatMap((d) => d.tags || []).find((t) => t.id === tagId);

    if (tag) {
      updateTagMutation.mutate({
        id: tagId,
        updates: {
          parentTagId: newParentId,
        },
      });
    }
  };

  const handleDeleteTag = (tagId: number) => {
    setDeletingTagId(tagId);
  };

  const confirmDeleteTag = () => {
    if (deletingTagId) {
      deleteTagMutation.mutate({ id: deletingTagId });
      if (selectedTagId === deletingTagId) {
        setSelectedTagId(null);
      }
      setDeletingTagId(null);
    }
  };

  const isSubmitting = createTagMutation.isPending || updateTagMutation.isPending;
  const isDimensionSubmitting = createDimensionMutation.isPending || updateDimensionMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const editingDimensionTags =
    editingTag && "dimensionId" in editingTag
      ? dimensions?.find((d) => d.id === editingTag.dimensionId)?.tags || []
      : editingTag && "tag" in editingTag
        ? dimensions?.find((d) => d.id === editingTag.tag.dimensionId)?.tags || []
        : [];

  return (
    <TagDragProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tag Dimensions</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-base-300 rounded-lg">
              <Button
                variant={viewMode === "tree" ? "default" : "ghost"}
                size="sm"
                onPress={() => setViewMode("tree")}
                className="rounded-r-none"
              >
                <TreePine className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onPress={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button onPress={() => setEditingDimension({ mode: "create" })} isDisabled={!!editingDimension}>
              <Plus className="w-4 h-4 mr-2" />
              Add Dimension
            </Button>
          </div>
        </div>

        <DimensionDialog
          editingDimension={editingDimension}
          onClose={() => setEditingDimension(null)}
          onSubmit={handleDimensionSubmit}
          isSubmitting={isDimensionSubmitting}
        />

        <div className="grid gap-4">
          {dimensions?.map((dimension) => (
            <DimensionCard
              key={dimension.id}
              dimension={dimension}
              viewMode={viewMode}
              onDeleteDimension={(dimensionId) => deleteDimensionMutation.mutate({ id: dimensionId })}
              onEditDimension={handleEditDimension}
              onUpdateParent={handleUpdateParent}
              onDeleteTag={handleDeleteTag}
              onCreateTag={handleCreateTag}
              onEditTag={handleEditTag}
              selectedTagId={selectedTagId ?? undefined}
              onSelectTag={setSelectedTagId}
              isDeletingDimension={deleteDimensionMutation.isPending}
            />
          ))}
        </div>

        <TagDialog
          editingTag={editingTag}
          dimension={
            editingTag
              ? dimensions?.find((d) =>
                  editingTag.mode === "create" ? d.id === editingTag.dimensionId : d.id === editingTag.tag.dimensionId
                )
              : undefined
          }
          availableTags={editingDimensionTags}
          onClose={() => setEditingTag(null)}
          onSubmit={handleTagSubmit}
          isSubmitting={isSubmitting}
        />

        <DeleteTagDialog
          isOpen={deletingTagId !== null}
          onConfirm={confirmDeleteTag}
          onCancel={() => setDeletingTagId(null)}
          isDeleting={deleteTagMutation.isPending}
        />
      </div>
    </TagDragProvider>
  );
};
