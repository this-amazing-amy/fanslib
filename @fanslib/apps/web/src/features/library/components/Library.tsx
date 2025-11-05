import type { MediaFilters } from "@fanslib/types";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useScan } from "~/hooks/useScan";
import { useMediaListQuery } from "~/lib/queries/media";
import { Gallery } from "./Gallery/Gallery";
import { GalleryPagination } from "./Gallery/GalleryPagination";
import { GalleryViewSettings } from "./Gallery/GalleryViewSettings";
import { LibrarySortOptions } from "./Gallery/LibrarySortOptions";
import { FilterActions } from "./MediaFilters/FilterActions";
import { MediaFilters as MediaFiltersComponent } from "./MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "./MediaFilters/MediaFiltersContext";
import { ScanButton } from "./ScanButton";
import { ScanProgress } from "./ScanProgress";

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
        <PageContainer className="h-full w-full overflow-hidden flex flex-col">
          {showHeader && (
            <PageHeader
              title="Library"
              description="Browse and manage your media collection"
              actions={<ScanButton isScanning={isScanning} onScan={handleScan} />}
              className="py-6 px-6 flex-none"
            />
          )}
          <div className="flex-1 min-h-0 p-6 flex flex-col">
            <SectionHeader
              title=""
              actions={
                <div className="flex items-center gap-2">
                  <FilterActions />
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
                </div>
              }
            />
            <div className="mb-4">
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
