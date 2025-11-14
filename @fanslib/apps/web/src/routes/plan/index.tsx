import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsProvider } from "~/contexts/AnalyticsContext";
import { LibraryPreferencesProvider } from "~/contexts/LibraryPreferencesContext";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { PlanPreferencesProvider } from "~/contexts/PlanPreferencesContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { RedditPostProvider } from "~/contexts/RedditPostContext";
import { ShootProvider } from "~/contexts/ShootContext";
import { ShootPreferencesProvider } from "~/contexts/ShootPreferencesContext";
import { TagDragProvider } from "~/contexts/TagDragContext";
import { PlanPage } from "~/features/plan/components/PlanPage";

const PlanPageContent = () => {
  return (
    <MediaSelectionProvider media={[]}>
      <MediaDragProvider>
        <TagDragProvider>
          <PostDragProvider>
            <ShootPreferencesProvider>
              <AnalyticsProvider>
                <PlanPreferencesProvider>
                  <RedditPostProvider>
                    <PlanPage />
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

export const PlanRoute = () => (
  <LibraryPreferencesProvider>
    <ShootProvider>
      <PlanPageContent />
    </ShootProvider>
  </LibraryPreferencesProvider>
);

export const Route = createFileRoute("/plan/")({
  component: PlanRoute,
});

