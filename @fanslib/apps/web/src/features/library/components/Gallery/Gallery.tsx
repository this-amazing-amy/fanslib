import type { Media } from "@fanslib/server/schemas";

import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { useDynamicPageSize } from "~/hooks/useDynamicPageSize";
import { useMediaSelectionSetup } from "~/hooks/useMediaSelectionSetup";
import { cn } from "~/lib/cn";
import { usePageMediaTagsQuery } from "~/lib/queries/tags";
import { useMediaSelectionStore } from "~/stores/mediaSelectionStore";
import { GalleryActionBar } from "./GalleryActionBar";
import { GalleryEmpty } from "./GalleryEmpty";

type GalleryProps = {
  medias: Media[];
  error?: string;
  onScan: () => void;
  onMediaClick?: (media: Media) => void;
};

const GalleryContent = ({ medias, error, onScan, onMediaClick }: GalleryProps) => {
  useMediaSelectionSetup(medias);
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

  const selectedIds = useMediaSelectionStore((s) => s.selectedIds);
  const clearSelection = useMediaSelectionStore((s) => s.clearSelection);
  const selectedMediaItems = useMemo(
    () => medias.filter((m) => selectedIds.has(m.id)),
    [medias, selectedIds],
  );

  const mediaIds = useMemo(() => medias.map((m) => m.id), [medias]);
  const { data: tagsByMediaId } = usePageMediaTagsQuery(mediaIds);

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
        selectedCount={selectedIds.size}
        selectedMedia={selectedMediaItems}
        onClearSelection={clearSelection}
      />
      <ScrollArea
        className="h-[calc(100%-3rem)] @container"
        ref={containerRef as React.RefObject<HTMLDivElement>}
      >
        <div
          className={cn(
            "grid gap-4 p-2 grid-cols-3",
            preferences.view.gridSize === "large"
              ? "@[48rem]:grid-cols-4 @[72rem]:grid-cols-6 @[128rem]:grid-cols-8"
              : "@[48rem]:grid-cols-4 @[72rem]:grid-cols-8 @[128rem]:grid-cols-12",
          )}
        >
          {medias.map((media, index) => (
            <MediaTile
              key={media.id}
              media={media}
              tags={tagsByMediaId?.get(media.id) ?? []}
              withSelection
              withPreview
              withDragAndDrop
              withDuration
              withNavigation
              withFileName
              withTags
              withPostsPopover
              index={index}
              onMediaClick={onMediaClick}
            />
          ))}
          {medias.length === 0 && <GalleryEmpty onScan={onScan} />}
        </div>
      </ScrollArea>
    </div>
  );
};

export const Gallery = (props: GalleryProps) => <GalleryContent {...props} />;
