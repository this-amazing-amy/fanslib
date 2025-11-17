import { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;
import { useEffect } from "react";

type UseGalleryKeyboardHandlingProps = {
  media: Media[];
  selectedMediaIds: Set<string>;
  clearSelection: () => void;
  setSelectedMediaIds: (ids: Set<string>) => void;
};

export const useGalleryKeyboardHandling = ({
  media,
  selectedMediaIds,
  clearSelection,
  setSelectedMediaIds,
}: UseGalleryKeyboardHandlingProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if no input elements are focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Handle Cmd+A (Select All)
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        const allMediaIds = new Set(media.map((m) => m.id));
        setSelectedMediaIds(allMediaIds);
      }

      // Handle Escape (Clear Selection)
      if (e.key === "Escape" && selectedMediaIds.size > 0) {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [media, selectedMediaIds, clearSelection, setSelectedMediaIds]);
};
