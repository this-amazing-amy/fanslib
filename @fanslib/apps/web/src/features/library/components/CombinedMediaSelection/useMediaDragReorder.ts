import type { Media } from "@fanslib/server/schemas";
import { useState } from "react";

type UseMediaDragReorderArgs = {
  combinedMedia: Media[];
  selectedMedia: Media[];
  onMediaSelect: (media: Media) => void;
  isSelected: (mediaId: string) => boolean;
};

export const useMediaDragReorder = ({
  combinedMedia,
  selectedMedia,
  onMediaSelect,
  isSelected,
}: UseMediaDragReorderArgs) => {
  const [draggedItem, setDraggedItem] = useState<Media | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, item: Media) => {
    if (!isSelected(item.id)) return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDragOverIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: Media, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    // Get indices of dragged item and target
    const draggedIndex = combinedMedia.findIndex((m) => m.id === draggedItem.id);
    if (draggedIndex === -1) return;

    // Reorder by removing dragged item and inserting at new position
    const newOrder = [...combinedMedia];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    // Update selection order
    const selectedIds = new Set(selectedMedia.map((m) => m.id));
    const reorderedSelected = newOrder.filter((m) => selectedIds.has(m.id));

    // Call onMediaSelect for each selected item in new order
    reorderedSelected.forEach((media) => {
      onMediaSelect(media);
    });

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  };
};
