import type { Media, MediaFilter } from '@fanslib/server/schemas';
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { MediaFilters } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { MediaTileLite } from "./MediaTile/MediaTileLite";


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
}: CombinedMediaSelectionProps) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MediaFilterType>(initialFilters);
  const [includeRecentlyPosted, setIncludeRecentlyPosted] = useState(false);

  const { data: mediaResponse } = useMediaListQuery({
    limit: pageLimit,
    page: currentPage,
    sort: { field: "fileModificationDate", direction: "DESC" },
    filters,
    scheduleId,
    channelId,
    autoApplyFilters,
    applyRepostCooldown: applyRepostCooldown && !includeRecentlyPosted,
  });

  const media: Media[] = (mediaResponse?.items as Media[] | undefined) ?? [];
  const totalPages = mediaResponse?.totalPages ?? 1;
  const totalItems = mediaResponse?.total ?? 0;

  const filteredMedia: Media[] = media.filter((m) => !excludeMediaIds.includes(m.id));

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

  const handleFilterChange = (newFilters: MediaFilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const isSelected = (mediaId: string) => selectedMedia.some((m) => m.id === mediaId);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-shrink-0">
        {autoApplyFilters && (scheduleId || channelId) ? (
          <div className="mb-2 px-2">
            <div className="flex items-center gap-2 text-xs text-base-content/70 bg-base-200/50 px-3 py-2 rounded-md">
              <span className="font-medium">🎯 Auto-filtering media</span>
              <span>
                {scheduleId && channelId
                  ? "based on schedule and channel"
                  : scheduleId
                    ? "based on schedule"
                    : "based on channel"}
              </span>
            </div>
          </div>
        ) : null}
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
        <div className={cn("flex flex-col gap-4", filters.length === 0 ? "p-1" : "py-1")}>
          <FilterPresetProvider onFiltersChange={handleFilterChange}>
            <MediaFiltersProvider value={filters} onChange={handleFilterChange}>
              <MediaFilters />
            </MediaFiltersProvider>
          </FilterPresetProvider>
        </div>
      </div>

      <div>
        <ScrollArea className="h-[400px] border rounded-md">
          <div className="p-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {combinedMedia.map((item) => {
                const itemIsSelected = isSelected(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all",
                      itemIsSelected
                        ? "ring-2 ring-primary"
                        : "hover:ring-2 hover:ring-primary/50"
                    )}
                    onClick={() => onMediaSelect(item)}
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
                    <MediaTileLite media={item} isActivePreview={item.id === activePreviewId} />
                    {itemIsSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
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
                  {autoApplyFilters && (scheduleId ?? channelId) && (
                    <p>
                      • Auto-applied filters from {scheduleId && channelId ? "schedule and channel" : scheduleId ? "schedule" : "channel"}
                    </p>
                  )}
                  {applyRepostCooldown && !includeRecentlyPosted && channelId && (
                    <p>
                      • Excluding recently posted media (within cooldown period)
                    </p>
                  )}
                  {filters.length > 0 && (
                    <p>
                      • Custom filters applied
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

