import { createFileRoute } from '@tanstack/react-router';
import { NavigationPageHeader } from '~/components/ui/NavigationPageHeader';
import { PostPreferencesProvider } from '~/contexts/PostPreferencesContext';
import { AnalyticsProvider } from '~/contexts/AnalyticsContext';
import { LibraryPreferencesProvider } from '~/contexts/LibraryPreferencesContext';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { PostDragProvider } from '~/contexts/PostDragContext';
import { RedditPostProvider } from '~/contexts/RedditPostContext';
import { ShootProvider } from '~/contexts/ShootContext';
import { ShootPreferencesProvider } from '~/contexts/ShootPreferencesContext';
import { TagDragProvider } from '~/contexts/TagDragContext';
import { Shoots } from '~/features/shoots/components/Shoots';

const ShootsPageContent = () => <MediaSelectionProvider media={[]}>
      <MediaDragProvider>
        <TagDragProvider>
          <PostDragProvider>
            <ShootPreferencesProvider>
              <AnalyticsProvider>
                <PostPreferencesProvider>
                  <RedditPostProvider>
                    <div className="flex h-full w-full flex-col overflow-hidden">
                      <div className="flex-none px-6 py-6">
                        <NavigationPageHeader
                          tabs={[
                            { label: 'Library', to: '/library' },
                            { label: 'Shoots', to: '/shoots' },
                          ]}
                        />
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <Shoots />
                      </div>
                    </div>
                  </RedditPostProvider>
                </PostPreferencesProvider>
              </AnalyticsProvider>
            </ShootPreferencesProvider>
          </PostDragProvider>
        </TagDragProvider>
      </MediaDragProvider>
    </MediaSelectionProvider>;

export const ShootsPage = () => (
  <LibraryPreferencesProvider>
    <ShootProvider>
      <ShootsPageContent />
    </ShootProvider>
  </LibraryPreferencesProvider>
);

export const Route = createFileRoute('/shoots/')({
  component: ShootsPage,
});

