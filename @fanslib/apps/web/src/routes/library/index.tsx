import { createFileRoute } from '@tanstack/react-router';
import { SplitViewLayout } from '~/components/SplitViewLayout';
import { AnalyticsProvider } from '~/contexts/AnalyticsContext';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { LibraryPreferencesProvider, useLibraryPreferences } from '~/contexts/LibraryPreferencesContext';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { PlanPreferencesProvider } from '~/contexts/PlanPreferencesContext';
import { PostDragProvider } from '~/contexts/PostDragContext';
import { RedditPostProvider } from '~/contexts/RedditPostContext';
import { ShootProvider } from '~/contexts/ShootContext';
import { ShootPreferencesProvider } from '~/contexts/ShootPreferencesContext';
import { TagDragProvider } from '~/contexts/TagDragContext';
import { Library } from '~/features/library/components/Library';
import { Shoots } from '~/features/shoots/components/Shoots';

const LibraryPageContent = () => {
  const { updatePreferences } = useLibraryPreferences();

  return (
      <MediaSelectionProvider media={[]}>
        <MediaDragProvider>
          <TagDragProvider>
            <PostDragProvider>
              <FilterPresetProvider onFiltersChange={(filters) => updatePreferences({ filter: filters })}>
                  <ShootPreferencesProvider>
                    <AnalyticsProvider>
                      <PlanPreferencesProvider>
                        <RedditPostProvider>


    <SplitViewLayout
      id="manage-page"
      mainContent={<Library />}
      sideContent={<Shoots />}
      mainDefaultSize={50}
      sideDefaultSize={50}
      sideMaxSize={50}
    />

                        </RedditPostProvider>
                      </PlanPreferencesProvider>
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