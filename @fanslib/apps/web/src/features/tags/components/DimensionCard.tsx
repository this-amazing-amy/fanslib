import type { TagDefinition, TagDefinitionSchema, TagDimension, TagDimensionSchema } from '@fanslib/server/schemas';
import { MoreVertical, PenLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardBody, CardTitle } from "~/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { DeleteDimensionDialog } from "./DeleteDimensionDialog";
import { TagTreeView } from "./TagTreeView";



type TagDimensionWithTags = TagDimension & { tags?: TagDefinition[] };

type DimensionCardProps = {
  dimension: TagDimensionWithTags;
  viewMode: "tree";
  selectedTagId?: number;
  onCreateTag: (dimensionId: number, parentTagId?: number) => void;
  onEditTag: (tag: TagDefinition) => void;
  onDeleteTag: (tagId: number) => void;
  onDeleteDimension: (dimensionId: number) => void;
  onEditDimension?: (dimension: TagDimensionWithTags) => void;
  onUpdateParent: (tagId: number, newParentId: number | null) => void;
  onSelectTag?: (tagId: number) => void;
  isDeletingDimension?: boolean;
};

export const DimensionCard = ({
  dimension,
  selectedTagId,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  onDeleteDimension,
  onEditDimension,
  onUpdateParent,
  onSelectTag,
  isDeletingDimension = false,
}: DimensionCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteDimension = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteDimension = () => {
    onDeleteDimension(dimension.id);
    setShowDeleteDialog(false);
  };

  const handleEditDimension = () => {
    onEditDimension?.(dimension);
  };

  return (
    <Card className="w-full">
      <CardBody className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{dimension.name}</CardTitle>
              {dimension.description && (
                <p className="text-sm text-base-content/60 mt-1">{dimension.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onPress={() => onCreateTag(dimension.id)} className="h-8">
              <Plus className="w-4 h-4 mr-1" />
              Add Tag
            </Button>

            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
              <DropdownMenuPopover placement="bottom end">
                <DropdownMenu
                  onAction={(key) => {
                    if (key === "edit") handleEditDimension();
                    if (key === "delete") handleDeleteDimension();
                  }}
                >
                  <DropdownMenuItem id="edit" className="flex items-center whitespace-nowrap">
                    <PenLine className="w-4 h-4 mr-2 shrink-0" />
                    Edit Dimension
                  </DropdownMenuItem>
                  <DropdownMenuItem id="delete" className="text-error flex items-center whitespace-nowrap">
                    <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                    Delete Dimension
                  </DropdownMenuItem>
                </DropdownMenu>
              </DropdownMenuPopover>
            </DropdownMenuTrigger>
          </div>
        </div>

        <div className="pt-0">
          {dimension.tags && dimension.tags.length > 0 ? (
            <TagTreeView
              tags={dimension.tags}
              selectedTagId={selectedTagId}
              onSelectTag={onSelectTag}
              onEditTag={onEditTag}
              onDeleteTag={onDeleteTag}
              onCreateTag={(parentTagId) => onCreateTag(dimension.id, parentTagId)}
              onUpdateParent={onUpdateParent}
            />
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <p>No tags in this dimension yet.</p>
              <Button variant="outline" size="sm" onPress={() => onCreateTag(dimension.id)} className="mt-2">
                <Plus className="w-4 h-4 mr-1" />
                Create First Tag
              </Button>
            </div>
          )}
        </div>
      </CardBody>

      <DeleteDimensionDialog
        isOpen={showDeleteDialog}
        dimensionName={dimension.name}
        onConfirm={confirmDeleteDimension}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={isDeletingDimension}
      />
    </Card>
  );
};
