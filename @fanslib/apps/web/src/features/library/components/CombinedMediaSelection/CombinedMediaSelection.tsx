import type { Media, MediaFilter } from "@fanslib/server/schemas";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { Button } from "~/components/ui/Button";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { cn } from "~/lib/cn";
import { useBulkMediaPostingHistoryQuery, useMediaListQuery } from "~/lib/queries/library";
import { MediaFilters } from "../MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "../MediaFilters/MediaFiltersContext";
import { MediaSelectionGrid } from "./MediaSelectionGrid";
import { useMediaClickSelection } from "./useMediaClickSelection";
import { useMediaDragReorder } from "./useMediaDragReorder";

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
  onClose,
}: CombinedMediaSelectionProps) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userFilters, setUserFilters] = useState<MediaFilterType>([]);
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
  const combinedFilters = useMemo(
    () => [...initialFilters, ...userFilters],
    [initialFilters, userFilters],
  );

  const { data: mediaResponse } = useMediaListQuery({
    limit: pageLimit,
    page: currentPage,
    sort: { field: "fileModificationDate", direction: "DESC" },
    filters: combinedFilters,
    scheduleId,
    channelId,
    autoApplyFilters,
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
    const selectedInLibrary = selectedMedia.filter(
      (m) => !excludeMediaIds.includes(m.id) && filteredMedia.some((fm) => fm.id === m.id),
    );
    const unselectedInLibrary = filteredMedia.filter((m) => !selectedIds.has(m.id));
    const selectedNotInLibrary = selectedMedia.filter(
      (m) => !excludeMediaIds.includes(m.id) && !filteredMedia.some((fm) => fm.id === m.id),
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

  const { draggedItem, dragOverIndex, handleDragStart, handleDragOver, handleDragEnd, handleDrop } =
    useMediaDragReorder({
      combinedMedia,
      selectedMedia,
      onMediaSelect,
      isSelected,
    });

  const { handleMediaClick } = useMediaClickSelection({
    combinedMedia,
    selectedMedia,
    onMediaSelect,
    isSelected,
  });

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-shrink-0">
        {/* Pre-applied filters badge */}
        {autoApplyFilters && (scheduleId || channelId) && initialFilters.length > 0 ? (
          <div className="mb-3 px-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-base-content/70">
                <span className="font-medium">
                  🎯 Pre-applied filters from{" "}
                  {scheduleId && channelId
                    ? "schedule and channel"
                    : scheduleId
                      ? "schedule"
                      : "channel"}
                  :
                </span>
              </div>
              <div className="bg-base-200/30 px-3 py-2 rounded-md border border-base-300/50">
                <MediaFilterSummary mediaFilters={initialFilters} />
              </div>
            </div>
          </div>
        ) : null}

        {/* User refinement filters */}
        <div className="mb-2 px-2">
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
            <MediaSelectionGrid
              combinedMedia={combinedMedia}
              activePreviewId={activePreviewId}
              postingHistoryMap={postingHistoryMap}
              channelId={channelId}
              draggedItem={draggedItem}
              dragOverIndex={dragOverIndex}
              isSelected={isSelected}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onMediaClick={handleMediaClick}
              onMouseEnter={(item) => {
                if (item.type === "video") {
                  setActivePreviewId(item.id);
                }
              }}
              onMouseLeave={(item) => {
                if (item.type === "video") {
                  setActivePreviewId(null);
                }
              }}
            />
            {combinedMedia.length === 0 && totalItems === 0 && (
              <div className="col-span-full text-center py-8 space-y-3">
                <h3 className="text-lg font-semibold text-base-content/80">
                  No eligible media found
                </h3>
                <div className="space-y-1.5 text-sm text-base-content/60">
                  {initialFilters.length > 0 && (
                    <p>
                      • Pre-applied filters from{" "}
                      {scheduleId && channelId
                        ? "schedule and channel"
                        : scheduleId
                          ? "schedule"
                          : "channel"}
                    </p>
                  )}
                  {userFilters.length > 0 && <p>• Additional custom filters applied</p>}
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
