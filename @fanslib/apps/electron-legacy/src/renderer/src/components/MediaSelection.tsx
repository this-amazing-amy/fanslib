import { cn } from "@renderer/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PaginatedResponse } from "../../../features/_common/pagination";
import { MediaFilters, MediaSort } from "../../../features/library/api-type";
import { Media } from "../../../features/library/entity";
import { sanitizeFilterInput } from "../../../features/library/filter-helpers";
import { MediaFilters as MediaFiltersComponent } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { FilterPresetProvider } from "../contexts/FilterPresetContext";
import { MediaTileLite } from "./MediaTile/MediaTileLite";
import { Button } from "./ui/Button";
import { ScrollArea } from "./ui/ScrollArea";
import { GridContainer } from "./ui/GridContainer/GridContainer";

type MediaSelectionProps = {
  selectedMedia: Media[];
  onMediaSelect: (media: Media) => void;
  className?: string;
  referenceMedia?: Media;
  excludeMediaIds?: string[];
  eligibleMediaFilter?: MediaFilters;
  sort?: MediaSort;
  pageLimit?: number;
};

export const MediaSelection = ({
  selectedMedia,
  onMediaSelect,
  className,
  excludeMediaIds = [],
  eligibleMediaFilter,
  pageLimit = 30,
  sort,
}: MediaSelectionProps) => {
  const [mediaData, setMediaData] = useState<PaginatedResponse<Media>>({
    items: [],
    total: 0,
    page: 1,
    limit: pageLimit,
    totalPages: 1,
  });
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MediaFilters>(() =>
    sanitizeFilterInput(eligibleMediaFilter)
  );
  const [fetched, setFetched] = useState<string>(JSON.stringify({}));

  const parameters = useMemo(() => {
    return {
      limit: pageLimit,
      page: currentPage,
      sort: sort ?? { field: "fileModificationDate", direction: "DESC" },
      filters,
    };
  }, [pageLimit, currentPage, sort, filters]);

  useEffect(() => {
    if (fetched === JSON.stringify(parameters)) return;
    const fetchRelatedMedia = async () => {
      try {
        const response = await window.api["library:getAll"](parameters);
        setMediaData({
          ...response,
          items: response.items.filter((m) => !excludeMediaIds.includes(m.id)),
        });
        setFetched(JSON.stringify(parameters));
      } catch (err) {
        console.error("Failed to fetch related media:", err);
        setMediaData({
          items: [],
          total: 0,
          page: 1,
          limit: pageLimit,
          totalPages: 1,
        });
      }
    };
    fetchRelatedMedia();
  }, [parameters, excludeMediaIds, fetched, pageLimit]);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, mediaData.totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleFilterChange = (newFilters: MediaFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-shrink-0">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-end items-center">
            <span className="text-xs text-muted-foreground">
              {`${mediaData.total} items available`}
            </span>
          </div>
          <FilterPresetProvider onFiltersChange={handleFilterChange}>
            <MediaFiltersProvider value={filters} onChange={handleFilterChange}>
              <MediaFiltersComponent />
            </MediaFiltersProvider>
          </FilterPresetProvider>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full border rounded-md">
          <div className="p-4">
            <GridContainer columns={5}>
              {mediaData.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all",
                    selectedMedia.some((m) => m.id === item.id)
                      ? "ring-2 ring-primary"
                      : "hover:ring-2 hover:ring-primary"
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
                </div>
              ))}
            </GridContainer>
            {mediaData.items.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No related media found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {mediaData.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Page {mediaData.page} of {mediaData.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="px-2 h-8"
            >
              <ChevronLeftIcon size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= mediaData.totalPages}
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
