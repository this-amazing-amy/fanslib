import type { Media, MediaFilter } from '@fanslib/server/schemas';
import { useEffect } from 'react';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { LibraryPreferencesProvider, useLibraryPreferences } from '~/contexts/LibraryPreferencesContext';
import { Gallery } from '~/features/library/components/Gallery/Gallery';
import { GalleryPagination } from '~/features/library/components/Gallery/GalleryPagination';
import { GallerySkeleton } from '~/features/library/components/Gallery/GallerySkeleton';
import { GalleryViewSettings } from '~/features/library/components/Gallery/GalleryViewSettings';
import { LibrarySortOptions } from '~/features/library/components/Gallery/LibrarySortOptions';
import { MediaFilters } from '~/features/library/components/MediaFilters/MediaFilters';
import { MediaFiltersProvider } from '~/features/library/components/MediaFilters/MediaFiltersContext';
import { useMediaListQuery } from '~/lib/queries/library';
import type { VirtualPost } from '~/lib/virtual-posts';
import { useInlinePicker } from '../contexts/InlinePickerContext';

type PlanLibraryPanelInnerProps = {
  virtualPost: VirtualPost | null;
  externalFilters: MediaFilter;
};

const PlanLibraryPanelInner = ({ virtualPost: _virtualPost, externalFilters }: PlanLibraryPanelInnerProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();

  // Sync external filters (from virtual post selection) with library preferences
  useEffect(() => {
    if (externalFilters.length > 0) {
      updatePreferences({
        filter: externalFilters,
        pagination: { page: 1 },
      });
    }
  }, [externalFilters, updatePreferences]);

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

  const updateFilters = (filters: MediaFilter) => {
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
          <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
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
              </div>
              <div className="mb-4">
                <MediaFilters
                  collapsed={preferences.view.filtersCollapsed}
                  onToggle={toggleFiltersCollapsed}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {isLoading || (isFetching && !mediaList) ? (
                <GallerySkeleton />
              ) : (
                <Gallery
                  medias={(mediaList?.items as Media[] | undefined) ?? []}
                  error={error ? (error instanceof Error ? error.message : 'Unknown error') : undefined}
                  onScan={() => {}}
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

export const PlanLibraryPanel = () => {
  const { state } = useInlinePicker();

  return (
    <LibraryPreferencesProvider storageKey="planLibraryPreferences">
      <PlanLibraryPanelInner 
        virtualPost={state.virtualPost} 
        externalFilters={state.filters}
      />
    </LibraryPreferencesProvider>
  );
};
