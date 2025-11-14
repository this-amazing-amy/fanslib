import { createFileRoute } from '@tanstack/react-router';
import { NavigationPageHeader } from '~/components/ui/NavigationPageHeader';
import { AnalyticsProvider } from '~/contexts/AnalyticsContext';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { PlanPreferencesProvider } from '~/contexts/PlanPreferencesContext';
import { PostDragProvider } from '~/contexts/PostDragContext';
import { RedditPostProvider } from '~/contexts/RedditPostContext';
import { ShootProvider } from '~/contexts/ShootContext';
import { ShootPreferencesProvider } from '~/contexts/ShootPreferencesContext';
import { TagDragProvider } from '~/contexts/TagDragContext';
import { Shoots } from '~/features/shoots/components/Shoots';
import { ShootViewSettings } from '~/features/shoots/components/ShootViewSettings';
import { ShootsFilter } from '~/components/ShootsFilter';

const ShootsPageContent = () => {
  return (
    <MediaSelectionProvider media={[]}>
      <MediaDragProvider>
        <TagDragProvider>
          <PostDragProvider>
            <ShootPreferencesProvider>
              <AnalyticsProvider>
                <PlanPreferencesProvider>
                  <RedditPostProvider>
                    <div className="flex h-full w-full flex-col overflow-hidden">
                      <div className="flex-none px-6 py-6">
                        <NavigationPageHeader
                          tabs={[
                            { label: 'Library', to: '/library' },
                            { label: 'Shoots', to: '/shoots' },
                          ]}
                          actions={
                            <div className="flex items-center gap-2">
                              <ShootsFilter />
                              <ShootViewSettings />
                            </div>
                          }
                        />
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <Shoots />
                      </div>
                    </div>
                  </RedditPostProvider>
                </PlanPreferencesProvider>
              </AnalyticsProvider>
            </ShootPreferencesProvider>
          </PostDragProvider>
        </TagDragProvider>
      </MediaDragProvider>
    </MediaSelectionProvider>
  );
};

export const ShootsPage = () => (
  <ShootProvider>
    <ShootsPageContent />
  </ShootProvider>
);

export const Route = createFileRoute('/shoots/')({
  component: ShootsPage,
});

