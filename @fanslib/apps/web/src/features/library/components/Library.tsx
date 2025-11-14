import type { MediaFilters } from "@fanslib/types";
import { PageContainer } from "~/components/ui/PageContainer";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useMediaListQuery } from "~/lib/queries/library";
import { Gallery } from "./Gallery/Gallery";
import { GalleryPagination } from "./Gallery/GalleryPagination";
import { MediaFilters as MediaFiltersComponent } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { ScanProgress } from "./ScanProgress";
import { useScan } from "~/hooks/useScan";
import { FilterActions } from "./MediaFilters/FilterActions";
import { GalleryViewSettings } from "./Gallery/GalleryViewSettings";
import { LibrarySortOptions } from "./Gallery/LibrarySortOptions";
import { ScanButton } from "./ScanButton";

export type LibraryProps = {
  showHeader?: boolean;
};

export const Library = ({ showHeader = true }: LibraryProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const { data: mediaList, error } = useMediaListQuery({
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

  return (
    <FilterPresetProvider onFiltersChange={updateFilters}>
      <MediaFiltersProvider value={preferences.filter} onChange={updateFilters}>
        <PageContainer className="flex h-full w-full flex-col overflow-hidden px-0 py-0">
          <div className="flex-1 min-h-0 p-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-end gap-2 mb-4">
                <GalleryViewSettings />
                <LibrarySortOptions
                  value={preferences.sort}
                  onChange={(sort) => {
                    updatePreferences({
                      sort,
                      pagination: { page: 1 },
                    });
                  }}
                />
                <ScanButton isScanning={isScanning} onScan={handleScan} />
              </div>
              <div className="mb-4">
                <FilterActions />
              </div>
              <MediaFiltersComponent />
            </div>

            <ScanProgress scanProgress={scanProgress} scanResult={scanResult} />

            <div className="flex-1 min-h-0 overflow-auto">
              <Gallery
                medias={mediaList?.items ?? []}
                error={error ? (error instanceof Error ? error.message : "Unknown error") : undefined}
                onScan={handleScan}
              />
            </div>
            <GalleryPagination totalPages={mediaList?.totalPages ?? 0} totalItems={mediaList?.total ?? 0} />
          </div>
        </PageContainer>
      </MediaFiltersProvider>
    </FilterPresetProvider>
  );
};
