import { PageHeader } from "~/components/ui/PageHeader";
import { AnalyticsProvider } from "~/contexts/AnalyticsContext";
import { LibraryPreferencesProvider } from "~/contexts/LibraryPreferencesContext";
import { MediaDragProvider } from "~/contexts/MediaDragContext";

import { PostDragProvider } from "~/contexts/PostDragContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { RedditPostProvider } from "~/contexts/RedditPostContext";
import { ShootProvider } from "~/contexts/ShootContext";
import { ShootPreferencesProvider } from "~/contexts/ShootPreferencesContext";
import { TagDragProvider } from "~/contexts/TagDragContext";
import { Library } from "~/features/library/components/Library";

const LibraryPageContent = () => (
  <MediaDragProvider>
    <TagDragProvider>
      <PostDragProvider>
        <ShootPreferencesProvider>
          <AnalyticsProvider>
            <PostPreferencesProvider>
              <RedditPostProvider>
                <div className="flex h-full w-full flex-col overflow-hidden">
                  <div className="flex-none px-6 py-6">
                    <PageHeader title="Library" />
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <Library />
                  </div>
                </div>
              </RedditPostProvider>
            </PostPreferencesProvider>
          </AnalyticsProvider>
        </ShootPreferencesProvider>
      </PostDragProvider>
    </TagDragProvider>
  </MediaDragProvider>
);

export const LibraryPage = () => (
  <LibraryPreferencesProvider>
    <ShootProvider>
      <LibraryPageContent />
    </ShootProvider>
  </LibraryPreferencesProvider>
);
