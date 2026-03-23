import type { Media } from "@fanslib/server/schemas";
import { useState } from "react";

type UseMediaClickSelectionArgs = {
  combinedMedia: Media[];
  selectedMedia: Media[];
  onMediaSelect: (media: Media) => void;
  isSelected: (mediaId: string) => boolean;
};

export const useMediaClickSelection = ({
  combinedMedia,
  selectedMedia,
  onMediaSelect,
  isSelected,
}: UseMediaClickSelectionArgs) => {
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const handleMediaClick = (e: React.MouseEvent, item: Media, itemIndex: number) => {
    // Don't trigger selection if clicking on drag handle
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const itemIsSelected = isSelected(item.id);

    // Shift-click for range selection
    if (isShift && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, itemIndex);
      const end = Math.max(lastClickedIndex, itemIndex);
      const rangeItems = combinedMedia.slice(start, end + 1);

      // Add all items in range to selection
      rangeItems.forEach((media) => {
        if (!isSelected(media.id)) {
          onMediaSelect(media);
        }
      });
      return;
    }

    // Cmd/Ctrl-click for multi-select (toggle individual item)
    if (isCtrlOrCmd) {
      onMediaSelect(item);
      setLastClickedIndex(itemIndex);
      return;
    }

    // Regular click - if item is already selected and there are multiple selected items,
    // clear all others and keep only this one. If not selected, toggle it.
    if (itemIsSelected && selectedMedia.length > 1) {
      // Clear all other selections, keep only this one
      selectedMedia.filter((m) => m.id !== item.id).forEach((m) => onMediaSelect(m));
    } else {
      // Toggle this item
      onMediaSelect(item);
    }

    setLastClickedIndex(itemIndex);
  };

  return { handleMediaClick };
};
