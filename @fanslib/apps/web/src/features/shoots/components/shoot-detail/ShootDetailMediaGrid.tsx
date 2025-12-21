import type { MediaSchema } from "@fanslib/server/schemas";
import { MediaTile } from "~/features/library/components/MediaTile";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { cn } from "~/lib/cn";

type Media = typeof MediaSchema.static;

type ShootDetailMediaGridProps = {
  medias: Media[];
};

export const ShootDetailMediaGrid = ({ medias }: ShootDetailMediaGridProps) => {
  const { preferences } = useLibraryPreferences();

  return (
    <MediaSelectionProvider media={medias}>
      <div
        className={cn(
          "grid gap-4",
          preferences.view.gridSize === "large"
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
        )}
      >
        {medias.map((media, index) => (
          <MediaTile
            key={media.id}
            media={media}
            allMedias={medias}
            withSelection
            withPreview
            withDragAndDrop
            withDuration
            withPostsPopover
            withNavigation
            withFileName
            withTags
            index={index}
          />
        ))}
      </div>
    </MediaSelectionProvider>
  );
};

