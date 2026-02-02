import type { Media, MediaFilter } from '@fanslib/server/schemas';
import { Check, ChevronLeftIcon, ChevronRightIcon, GripVertical } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { cn } from "~/lib/cn";
import { useMediaListQuery, useBulkMediaPostingHistoryQuery } from "~/lib/queries/library";
import { MediaFilters } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { MediaTileLite } from "./MediaTile/MediaTileLite";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";


type MediaFilterType = MediaFilter;

type CombinedMediaSelectionProps = {
  selectedMedia: Media[];
  onMediaSelect: (media: Media) => void;
  className?: string;
  excludeMediaIds?: string[];
  pageLimit?: number;
  initialFilters?: MediaFilterType;
  scheduleId?: string;
  channelId?: string;
  autoApplyFilters?: boolean;
  applyRepostCooldown?: boolean;
  onClose?: () => void;
};

export const CombinedMediaSelection = ({
  selectedMedia,
  onMediaSelect,
  className,
  excludeMediaIds = [],
  pageLimit = 30,
  initialFilters = [],
  scheduleId,
  channelId,
  autoApplyFilters = false,
  applyRepostCooldown = false,
  onClose,
}: CombinedMediaSelectionProps) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userFilters, setUserFilters] = useState<MediaFilterType>([]);
  const [includeRecentlyPosted, setIncludeRecentlyPosted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Media | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Reset user filters when panel closes
  useEffect(() => {
    if (onClose) {
      return () => {
        setUserFilters([]);
      };
    }
  }, [onClose]);

  // Combine user filters with initial filters for the query
  // Initial filters are pre-applied, user filters are additional refinements
  const combinedFilters = useMemo(() => [...initialFilters, ...userFilters], [initialFilters, userFilters]);

  const { data: mediaResponse } = useMediaListQuery({
    limit: pageLimit,
    page: currentPage,
    sort: { field: "fileModificationDate", direction: "DESC" },
    filters: combinedFilters,
    scheduleId,
    channelId,
    autoApplyFilters,
    applyRepostCooldown: applyRepostCooldown && !includeRecentlyPosted,
  });

  const media: Media[] = (mediaResponse?.items as Media[] | undefined) ?? [];
  const totalPages = mediaResponse?.totalPages ?? 1;
  const totalItems = mediaResponse?.total ?? 0;

  const filteredMedia: Media[] = media.filter((m) => !excludeMediaIds.includes(m.id));

  // Fetch posting history for all visible media
  const mediaIds = filteredMedia.map((m) => m.id);
  const { data: postingHistoryMap } = useBulkMediaPostingHistoryQuery(mediaIds);

  // Merge selected media with filtered media, sorting selected items first
  const combinedMedia = useMemo(() => {
    const selectedIds = new Set(selectedMedia.map((m) => m.id));
    const selectedInLibrary = selectedMedia.filter((m) => 
      !excludeMediaIds.includes(m.id) && filteredMedia.some((fm) => fm.id === m.id)
    );
    const unselectedInLibrary = filteredMedia.filter((m) => !selectedIds.has(m.id));
    const selectedNotInLibrary = selectedMedia.filter((m) => 
      !excludeMediaIds.includes(m.id) && !filteredMedia.some((fm) => fm.id === m.id)
    );

    // Sort: selected items from current page first, then selected items not in current page, then unselected
    return [...selectedInLibrary, ...selectedNotInLibrary, ...unselectedInLibrary];
  }, [selectedMedia, filteredMedia, excludeMediaIds]);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleUserFilterChange = (newFilters: MediaFilterType) => {
    setUserFilters(newFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [userFilters]);

  const isSelected = (mediaId: string) => selectedMedia.some((m) => m.id === mediaId);

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
    const selectedIds = new Set(selectedMedia.map(m => m.id));
    const reorderedSelected = newOrder.filter(m => selectedIds.has(m.id));
    
    // Call onMediaSelect for each selected item in new order
    reorderedSelected.forEach(media => {
      onMediaSelect(media);
    });

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleMediaClick = (e: React.MouseEvent, item: Media, itemIndex: number) => {
    // Don't trigger selection if clicking on drag handle
    if ((e.target as HTMLElement).closest('.drag-handle')) {
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
      rangeItems.forEach(media => {
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
      selectedMedia.filter(m => m.id !== item.id).forEach(m => onMediaSelect(m));
    } else {
      // Toggle this item
      onMediaSelect(item);
    }
    
    setLastClickedIndex(itemIndex);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-shrink-0">
        {/* Pre-applied filters badge */}
        {autoApplyFilters && (scheduleId || channelId) && initialFilters.length > 0 ? (
          <div className="mb-3 px-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-base-content/70">
                <span className="font-medium">🎯 Pre-applied filters from {scheduleId && channelId ? "schedule and channel" : scheduleId ? "schedule" : "channel"}:</span>
              </div>
              <div className="bg-base-200/30 px-3 py-2 rounded-md border border-base-300/50">
                <MediaFilterSummary mediaFilters={initialFilters} />
              </div>
            </div>
          </div>
        ) : null}

        {/* Repost cooldown toggle */}
        {applyRepostCooldown && channelId ? (
          <div className="mb-2 px-2">
            <Checkbox
              isSelected={includeRecentlyPosted}
              onChange={setIncludeRecentlyPosted}
            >
              <span className="text-xs">Include recently posted media</span>
            </Checkbox>
          </div>
        ) : null}

        {/* User refinement filters */}
        <div className="mb-2 px-2">
          <div className="text-xs font-medium text-base-content/70 mb-2">
            Additional filters:
          </div>
          <div className={cn("flex flex-col gap-4", userFilters.length === 0 ? "p-1" : "py-1")}>
            <FilterPresetProvider onFiltersChange={handleUserFilterChange}>
              <MediaFiltersProvider value={userFilters} onChange={handleUserFilterChange}>
                <MediaFilters />
              </MediaFiltersProvider>
            </FilterPresetProvider>
          </div>
        </div>
      </div>

      <div>
        <ScrollArea className="h-[400px] border rounded-md" ref={scrollAreaRef}>
          <div className="p-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {combinedMedia.map((item, index) => {
                const itemIsSelected = isSelected(item.id);
                const postingHistory = postingHistoryMap?.get(item.id);
                
                // Check if media is within cooldown - only applies when:
                // 1. applyRepostCooldown is true
                // 2. includeRecentlyPosted is true (showing items that would normally be filtered)
                // 3. The item has posting history to current channel
                const isWithinCooldown = Boolean(
                  applyRepostCooldown && 
                  includeRecentlyPosted && 
                  channelId &&
                  postingHistory?.postsByChannel?.some((p) => p.channelId === channelId)
                );

                const isDragging = draggedItem?.id === item.id;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all",
                      itemIsSelected
                        ? "ring-2 ring-primary"
                        : "hover:ring-2 hover:ring-primary/50",
                      isDragging && "opacity-50",
                      isDragOver && "ring-2 ring-primary ring-offset-2"
                    )}
                    draggable={itemIsSelected}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, item, index)}
                    onClick={(e) => handleMediaClick(e, item, index)}
                    onMouseEnter={() => {
                      if (item.type === "video") {
                        setActivePreviewId(item.id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (item.type === "video") {
                        setActivePreviewId(null);
                      }
                    }}
                  >
                    <MediaTileLite
                      media={item}
                      isActivePreview={item.id === activePreviewId}
                      postingHistory={postingHistory}
                      currentChannelId={channelId}
                      isWithinCooldown={isWithinCooldown}
                    />
                    {itemIsSelected && (
                      <>
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <div className="drag-handle absolute top-1 left-1 w-6 h-6 rounded bg-base-100/90 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-base-content/70" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {combinedMedia.length === 0 && totalItems === 0 && (
              <div className="col-span-full text-center py-8 space-y-3">
                <h3 className="text-lg font-semibold text-base-content/80">
                  No eligible media found
                </h3>
                <div className="space-y-1.5 text-sm text-base-content/60">
                  {initialFilters.length > 0 && (
                    <p>
                      • Pre-applied filters from {scheduleId && channelId ? "schedule and channel" : scheduleId ? "schedule" : "channel"}
                    </p>
                  )}
                  {applyRepostCooldown && !includeRecentlyPosted && channelId && (
                    <p>
                      • Excluding recently posted media (within cooldown period)
                    </p>
                  )}
                  {userFilters.length > 0 && (
                    <p>
                      • Additional custom filters applied
                    </p>
                  )}
                </div>
                <p className="text-sm text-base-content/60 pt-2">
                  Try adjusting your filters or skip this slot
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 flex-shrink-0">
          <div className="text-sm text-base-content/60">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={handlePrevPage}
              isDisabled={currentPage <= 1}
              className="px-2 h-8"
            >
              <ChevronLeftIcon size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handleNextPage}
              isDisabled={currentPage >= totalPages}
              className="px-2 h-8"
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

