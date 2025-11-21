import { createFileRoute } from '@tanstack/react-router';
import { NavigationPageHeader } from '~/components/ui/NavigationPageHeader';
import { AnalyticsProvider } from '~/contexts/AnalyticsContext';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { LibraryPreferencesProvider, useLibraryPreferences } from '~/contexts/LibraryPreferencesContext';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { PostDragProvider } from '~/contexts/PostDragContext';
import { PostPreferencesProvider } from '~/contexts/PostPreferencesContext';
import { RedditPostProvider } from '~/contexts/RedditPostContext';
import { ShootProvider } from '~/contexts/ShootContext';
import { ShootPreferencesProvider } from '~/contexts/ShootPreferencesContext';
import { TagDragProvider } from '~/contexts/TagDragContext';
import { GalleryViewSettings } from '~/features/library/components/Gallery/GalleryViewSettings';
import { LibrarySortOptions } from '~/features/library/components/Gallery/LibrarySortOptions';
import { Library } from '~/features/library/components/Library';
import { FilterActions } from '~/features/library/components/MediaFilters/FilterActions';
import { MediaFiltersProvider } from '~/features/library/components/MediaFilters/MediaFiltersContext';
import { ScanButton } from '~/features/library/components/ScanButton';
import { useScan } from '~/hooks/useScan';

const LibraryPageContent = () => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const { isScanning, handleScan } = useScan();

  return (
      <MediaSelectionProvider media={[]}>
        <MediaDragProvider>
          <TagDragProvider>
            <PostDragProvider>
              <FilterPresetProvider onFiltersChange={(filters) => updatePreferences({ filter: filters })}>
                  <ShootPreferencesProvider>
                    <AnalyticsProvider>
                      <PostPreferencesProvider>
                        <RedditPostProvider>
                          <MediaFiltersProvider value={preferences.filter} onChange={(filters) => updatePreferences({ filter: filters, pagination: { page: 1 } })}>
                            <div className="flex h-full w-full flex-col overflow-hidden">
                              <div className="flex-none px-6 py-6">
                                <NavigationPageHeader
                                  tabs={[
                                    { label: 'Library', to: '/library' },
                                    { label: 'Shoots', to: '/shoots' },
                                  ]}
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
                                      <ScanButton isScanning={isScanning} onScan={handleScan} />
                                    </div>
                                  }
                                />
                              </div>
                              <div className="flex-1 min-h-0 overflow-hidden">
                                <Library />
                              </div>
                            </div>
                          </MediaFiltersProvider>
                        </RedditPostProvider>
                      </PostPreferencesProvider>
                    </AnalyticsProvider>
                  </ShootPreferencesProvider>
              </FilterPresetProvider>
            </PostDragProvider>
          </TagDragProvider>
        </MediaDragProvider>
      </MediaSelectionProvider>
  );
};

export const LibraryPage = () => (
  <LibraryPreferencesProvider>
  <ShootProvider>
        <LibraryPageContent />
      </ShootProvider>
      </LibraryPreferencesProvider>
);

export const Route = createFileRoute('/library/')({
  component: LibraryPage,
});