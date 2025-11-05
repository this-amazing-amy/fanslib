import type { Media } from "@fanslib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useGalleryKeyboardHandling } from "~/hooks/useGalleryKeyboardHandling";

type MediaSelectionContextType = {
  selectedMediaIds: Set<string>;
  isSelected: (mediaId: string) => boolean;
  toggleMediaSelection: (mediaId: string, event: React.MouseEvent) => void;
  clearSelection: () => void;
  lastClickedIndex: number | null;
  isShiftPressed: boolean;
  currentHoveredMediaId: string | null;
  setCurrentHoveredMediaId: (mediaId: string | null) => void;
  isHighlighted: (mediaId: string) => boolean;
};

const MediaSelectionContext = createContext<MediaSelectionContextType | null>(null);

type MediaSelectionProviderProps = {
  children: React.ReactNode;
  media: Media[] | Map<string, Media[]>;
};

type FlattenedMedia = {
  media: Media;
  groupKey: string;
  globalIndex: number;
};

const sortMediaByDate = (a: Media, b: Media) =>
  b.fileCreationDate.getTime() - a.fileCreationDate.getTime();

export const MediaSelectionProvider = ({ children, media }: MediaSelectionProviderProps) => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [currentHoveredMediaId, setCurrentHoveredMediaId] = useState<string | null>(null);

  // Convert input to a consistent format and calculate global indices
  const { flattenedMedia, mediaList } = useMemo(() => {
    if (Array.isArray(media)) {
      // Handle backward compatibility case
      const sorted = [...media].sort(sortMediaByDate);
      const flattened = sorted.map((m, i) => ({
        media: m,
        groupKey: "default",
        globalIndex: i,
      }));
      return { flattenedMedia: flattened, mediaList: sorted };
    }

    // Sort group keys (they are now padded indices, so string sort works)
    const sortedKeys = Array.from(media.keys()).sort();

    // eslint-disable-next-line functional/no-let
    let globalIndex = 0;
    const flattened: FlattenedMedia[] = [];
    const allMedia: Media[] = [];

    sortedKeys.forEach((key) => {
      const groupMedia = media.get(key) ?? [];

      // Sort media within each group
      const sortedGroupMedia = [...groupMedia].sort(sortMediaByDate);
      sortedGroupMedia.forEach((m) => {
        flattened.push({
          media: m,
          groupKey: key,
          globalIndex: globalIndex++,
        });
        allMedia.push(m);
      });
    });

    return { flattenedMedia: flattened, mediaList: allMedia };
  }, [media]);

  const clearSelection = useCallback(() => {
    setSelectedMediaIds(new Set());
    setLastClickedIndex(null);
  }, []);

  useGalleryKeyboardHandling({
    media: mediaList,
    selectedMediaIds,
    clearSelection,
    setSelectedMediaIds,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    // Handle case where user switches windows while holding shift
    const handleBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [lastClickedIndex]);

  useEffect(() => {
    // When media items are filtered out, remove them from selection
    // If all selected items are filtered out, clear the entire selection state
    const mediaIds = new Set(mediaList.map((m) => m.id));
    const newSelectedIds = new Set(Array.from(selectedMediaIds).filter((id) => mediaIds.has(id)));

    if (newSelectedIds.size !== selectedMediaIds.size) {
      setSelectedMediaIds(newSelectedIds);
      if (newSelectedIds.size === 0) {
        setLastClickedIndex(null);
      }
    }
  }, [mediaList, selectedMediaIds]);

  const getIndexRange = (index1: number, index2: number) => {
    const start = Math.min(index1, index2);
    const end = Math.max(index1, index2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const toggleMediaSelection = useCallback(
    (mediaId: string, event: React.MouseEvent) => {
      event.preventDefault();
      const selectedItem = flattenedMedia.find((m) => m.media.id === mediaId);
      if (!selectedItem) return;

      // Multi-selection (shift + click)
      if (isShiftPressed && lastClickedIndex !== null) {
        const indices = getIndexRange(lastClickedIndex, selectedItem.globalIndex);

        setSelectedMediaIds((prev) => {
          const newSelection = new Set(prev);
          flattenedMedia
            .filter((m) => indices.includes(m.globalIndex))
            .forEach((m) => newSelection.add(m.media.id));
          return newSelection;
        });
        setLastClickedIndex(selectedItem.globalIndex);
        return;
      }

      // Single selection
      setSelectedMediaIds((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(mediaId)) {
          newSelection.delete(mediaId);
        } else {
          newSelection.add(mediaId);
        }
        return newSelection;
      });
      setLastClickedIndex(selectedItem.globalIndex);
    },
    [flattenedMedia, isShiftPressed, lastClickedIndex]
  );

  const isSelected = useCallback(
    (mediaId: string) => selectedMediaIds.has(mediaId),
    [selectedMediaIds]
  );

  const isHighlighted = useCallback(
    (mediaId: string) => {
      if (lastClickedIndex === null || !currentHoveredMediaId) return false;
      if (selectedMediaIds.size === 0) return false;
      if (!isShiftPressed) return false;

      const hoveredItem = flattenedMedia.find((m) => m.media.id === currentHoveredMediaId);
      if (!hoveredItem) return false;

      const currentItem = flattenedMedia.find((m) => m.media.id === mediaId);
      if (!currentItem) return false;

      const shouldHighlight =
        currentItem.globalIndex >= Math.min(lastClickedIndex, hoveredItem.globalIndex) &&
        currentItem.globalIndex <= Math.max(lastClickedIndex, hoveredItem.globalIndex);

      return shouldHighlight;
    },
    [lastClickedIndex, currentHoveredMediaId, selectedMediaIds.size, isShiftPressed, flattenedMedia]
  );

  const value = useMemo(
    () => ({
      selectedMediaIds,
      isSelected,
      toggleMediaSelection,
      clearSelection,
      lastClickedIndex,
      isShiftPressed,
      currentHoveredMediaId,
      setCurrentHoveredMediaId,
      isHighlighted,
    }),
    [
      selectedMediaIds,
      isSelected,
      toggleMediaSelection,
      clearSelection,
      lastClickedIndex,
      isShiftPressed,
      currentHoveredMediaId,
      isHighlighted,
    ]
  );

  return <MediaSelectionContext.Provider value={value}>{children}</MediaSelectionContext.Provider>;
};

export const useMediaSelection = () => {
  const context = useContext(MediaSelectionContext);
  if (!context) {
    throw new Error("useMediaSelection must be used within a MediaSelectionProvider");
  }
  return context;
};
