import type { Media, MediaFilter, MediaFilterSchema, MediaSchema } from '@fanslib/server/schemas';
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useScan } from "~/hooks/useScan";
import { useMediaListQuery } from "~/lib/queries/library";
import { Gallery } from "./Gallery/Gallery";
import { GalleryPagination } from "./Gallery/GalleryPagination";
import { GallerySkeleton } from "./Gallery/GallerySkeleton";
import { GalleryViewSettings } from "./Gallery/GalleryViewSettings";
import { LibrarySortOptions } from "./Gallery/LibrarySortOptions";
import { MediaFilters as MediaFiltersComponent } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { ScanButton } from "./ScanButton";
import { ScanProgress } from "./ScanProgress";
import { cn } from "~/lib/cn";

type MediaFilters = MediaFilter;

type LibraryContentProps = {
  showScan?: boolean;
  contentClassName?: string;
};

export const LibraryContent = ({ showScan = true, contentClassName }: LibraryContentProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const {
    data: mediaList,
    error,
    isLoading,
    isFetching,
  } = useMediaListQuery({
    page: preferences.pagination.page,
    limit: preferences.pagination.limit,
    sort: preferences.sort,
    filters: preferences.filter,
  });
  const { isScanning, scanProgress, handleScan, scanResult } = useScan();

  const updateFilters = (filters: MediaFilters) => {
    updatePreferences({
      filter: filters,
      pagination: { page: 1 },
    });
  };

  const toggleFiltersCollapsed = () => {
    updatePreferences({
      view: {
        filtersCollapsed: !preferences.view.filtersCollapsed,
      },
    });
  };

  return (
    <FilterPresetProvider onFiltersChange={updateFilters}>
      <MediaFiltersProvider value={preferences.filter} onChange={updateFilters}>
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className={cn("flex-1 min-h-0 px-6 pb-6 flex flex-col", contentClassName)}>
            <div className="mb-4">
              <div className="flex items-center justify-end gap-2 pt-2 mb-4">
                <LibrarySortOptions
                  value={preferences.sort}
                  onChange={(sort) => {
                    updatePreferences({
                      sort,
                      pagination: { page: 1 },
                    });
                  }}
                />
                <GalleryViewSettings />
                {showScan ? <ScanButton isScanning={isScanning} onScan={handleScan} /> : null}
              </div>
              <div className="mb-4">
                <MediaFiltersComponent
                  collapsed={preferences.view.filtersCollapsed}
                  onToggle={toggleFiltersCollapsed}
                />
              </div>
            </div>

            {showScan ? (
              <ScanProgress scanProgress={scanProgress} scanResult={scanResult} />
            ) : null}

            <div className="flex-1 min-h-0 overflow-auto">
              {isLoading || (isFetching && !mediaList) ? (
                <GallerySkeleton />
              ) : (
                <Gallery
                  medias={(mediaList?.items as Media[] | undefined) ?? []}
                  error={error ? (error instanceof Error ? error.message : "Unknown error") : undefined}
                  onScan={showScan ? handleScan : () => {}}
                />
              )}
            </div>
            <GalleryPagination totalPages={mediaList?.totalPages ?? 0} totalItems={mediaList?.total ?? 0} />
          </div>
        </div>
      </MediaFiltersProvider>
    </FilterPresetProvider>
  );
};

