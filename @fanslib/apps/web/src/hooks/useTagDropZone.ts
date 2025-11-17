import { TagDefinitionSchema } from "@fanslib/server/schemas";

type TagDefinition = typeof TagDefinitionSchema.static;
import { useTagDrag } from "~/contexts/TagDragContext";
import { useDragOver } from "./useDragOver";

type UseTagDropZoneOptions = {
  targetTag?: TagDefinition;
  allTags: TagDefinition[];
  onUpdateParent: (tagId: number, newParentId: number | null) => void;
  isRootDropZone?: boolean;
};

export const useTagDropZone = ({
  targetTag,
  allTags,
  onUpdateParent,
  isRootDropZone = false,
}: UseTagDropZoneOptions) => {
  const { draggedTag, endTagDrag, isDragging } = useTagDrag();

  const canAcceptDrop = () => {
    if (!draggedTag) return false;

    // Can't drop on itself
    if (targetTag && draggedTag.id === targetTag.id) return false;

    // Check for circular references
    if (targetTag) {
      const wouldCreateCircle = (potentialParentId: number, potentialChildId: number): boolean => {
        // Check if potentialParentId is a descendant of potentialChildId
        const checkDescendant = (tagId: number): boolean => {
          const tag = allTags.find((t) => t.id === tagId);
          if (!tag) return false;
          if (tag.parentTagId === potentialChildId) return true;
          if (tag.parentTagId) return checkDescendant(tag.parentTagId);
          return false;
        };

        return checkDescendant(potentialParentId);
      };

      // Check if making targetTag the parent of draggedTag would create a circle
      // This happens if targetTag is already a descendant of draggedTag
      if (wouldCreateCircle(targetTag.id, draggedTag.id)) {
        return false;
      }
    }

    return true;
  };

  const { isOver, dragHandlers } = useDragOver({
    onDragOver: (e) => {
      if (!isDragging || !canAcceptDrop()) {
        e.dataTransfer.dropEffect = "none";
        return;
      }
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: () => {
      if (!isDragging || !draggedTag || !canAcceptDrop()) return;

      const newParentId = isRootDropZone ? null : targetTag?.id ?? null;
      onUpdateParent(draggedTag.id, newParentId);
      endTagDrag();
    },
  });

  return {
    isOver: isOver && isDragging && canAcceptDrop(),
    isDragging,
    draggedTag,
    canAcceptDrop: canAcceptDrop(),
    dragHandlers,
  };
};
