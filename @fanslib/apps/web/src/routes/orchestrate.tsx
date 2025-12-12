import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsProvider } from "~/contexts/AnalyticsContext";
import { LibraryPreferencesProvider } from "~/contexts/LibraryPreferencesContext";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { RedditPostProvider } from "~/contexts/RedditPostContext";
import { ShootProvider } from "~/contexts/ShootContext";
import { TagDragProvider } from "~/contexts/TagDragContext";
import { OrchestratePage } from "~/features/posts/components/OrchestratePage";

const OrchestrateRoute = () => (
  <MediaSelectionProvider media={[]}>
    <MediaDragProvider>
      <TagDragProvider>
        <PostDragProvider>
          <LibraryPreferencesProvider>
            <ShootProvider>
              <PostPreferencesProvider>
                <AnalyticsProvider>
                  <RedditPostProvider>
                    <div className="h-full overflow-hidden">
                      <OrchestratePage />
                    </div>
                  </RedditPostProvider>
                </AnalyticsProvider>
              </PostPreferencesProvider>
            </ShootProvider>
          </LibraryPreferencesProvider>
        </PostDragProvider>
      </TagDragProvider>
    </MediaDragProvider>
  </MediaSelectionProvider>
);

export const Route = createFileRoute("/orchestrate")({
  component: OrchestrateRoute,
});

