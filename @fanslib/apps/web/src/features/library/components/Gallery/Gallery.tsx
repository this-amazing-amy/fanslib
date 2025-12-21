import type { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;
import { useEffect, useRef } from "react";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { MediaSelectionProvider, useMediaSelection } from "~/contexts/MediaSelectionContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { useDynamicPageSize } from "~/hooks/useDynamicPageSize";
import { cn } from "~/lib/cn";
import { GalleryActionBar } from "./GalleryActionBar";
import { GalleryEmpty } from "./GalleryEmpty";

type GalleryProps = {
  medias: Media[];
  error?: string;
  onScan: () => void;
};

const GalleryContent = ({ medias, error, onScan }: GalleryProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const containerRef = useRef<HTMLElement | null>(null);

  const { pageSize } = useDynamicPageSize(containerRef, preferences.view.gridSize);

  useEffect(() => {
    if (pageSize !== preferences.pagination.limit && pageSize > 0) {
      updatePreferences({
        pagination: {
          limit: pageSize,
        },
      });
    }
  }, [pageSize, preferences.pagination.limit, updatePreferences]);

  const { selectedMediaIds, clearSelection } = useMediaSelection();
  const selectedMediaItems = medias.filter((m) => selectedMediaIds.has(m.id));

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <GalleryActionBar
        selectedCount={selectedMediaIds.size}
        selectedMedia={selectedMediaItems}
        onClearSelection={clearSelection}
      />
      <ScrollArea className="h-[calc(100%-3rem)] @container" ref={containerRef as React.RefObject<HTMLDivElement>}>
        <div
          className={cn(
            "grid gap-4 p-0 grid-cols-3",
            preferences.view.gridSize === "large"
              ? "@[48rem]:grid-cols-4 @[72rem]:grid-cols-6 @[128rem]:grid-cols-8"
              : "@[48rem]:grid-cols-4 @[72rem]:grid-cols-8 @[128rem]:grid-cols-12"
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
          {medias.length === 0 && <GalleryEmpty onScan={onScan} />}
        </div>
      </ScrollArea>
    </div>
  );
};

export const Gallery = (props: GalleryProps) => <MediaSelectionProvider media={props.medias}>
      <GalleryContent {...props} />
    </MediaSelectionProvider>;
