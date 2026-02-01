import type { Media, MediaFilter, MediaFilterSchema, MediaSchema } from '@fanslib/server/schemas';
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";
import { GridContainer } from "~/components/ui/GridContainer";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { MediaFilters } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { MediaTileLite } from "./MediaTile/MediaTileLite";


type MediaFilterType = MediaFilter;

type MediaSelectionProps = {
  selectedMedia: Media[];
  onMediaSelect: (media: Media) => void;
  className?: string;
  excludeMediaIds?: string[];
  pageLimit?: number;
};

export const MediaSelection = ({
  selectedMedia,
  onMediaSelect,
  className,
  excludeMediaIds = [],
  pageLimit = 30,
}: MediaSelectionProps) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MediaFilterType>([]);

  const { data: mediaResponse } = useMediaListQuery({
    limit: pageLimit,
    page: currentPage,
    sort: { field: "fileModificationDate", direction: "DESC" },
    filters,
  });

  const media: Media[] = (mediaResponse?.items as Media[] | undefined) ?? [];
  const total = mediaResponse?.total ?? 0;
  const totalPages = mediaResponse?.totalPages ?? 1;

  const filteredMedia: Media[] = media.filter((m) => !excludeMediaIds.includes(m.id));

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleFilterChange = (newFilters: MediaFilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-shrink-0">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-end items-center">
            <span className="text-xs text-base-content/60">
              {`${total} items available`}
            </span>
          </div>
          <FilterPresetProvider onFiltersChange={handleFilterChange}>
            <MediaFiltersProvider value={filters} onChange={handleFilterChange}>
              <MediaFilters />
            </MediaFiltersProvider>
          </FilterPresetProvider>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full border rounded-md">
          <div className="p-4">
            <GridContainer columns={5}>
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all",
                    selectedMedia.some((m) => m.id === item.id)
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
                </div>
              ))}
            </GridContainer>
            {filteredMedia.length === 0 && (
              <div className="col-span-full text-center py-8 text-base-content/60">
                No related media found
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
