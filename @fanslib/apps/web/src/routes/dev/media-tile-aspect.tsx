import type { Media } from "@fanslib/server/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { useMediaSelectionSetup } from "~/hooks/useMediaSelectionSetup";
import { useMediaListQuery } from "~/lib/queries/library";
import { usePageMediaTagsQuery } from "~/lib/queries/tags";

const phoneAspectFrameClassName = "aspect-[9/16]";

const galleryTileProps = {
  withSelection: true,
  withPreview: true,
  withDragAndDrop: true,
  withDuration: true,
  withNavigation: true,
  withFileName: true,
  withTags: true,
  withPostsPopover: true,
} as const;

const MediaTileAspectPrototypePage = () => {
  const { data, isLoading } = useMediaListQuery({ page: 1, limit: 6 });
  const items = (data?.items ?? []) as unknown as Media[];

  useMediaSelectionSetup(items);

  const mediaIds = useMemo(() => items.map((m) => m.id), [items]);
  const { data: tagsByMediaId } = usePageMediaTagsQuery(mediaIds);

  return (
    <MediaDragProvider>
      <PageContainer>
        <PageHeader title="Media tile aspect (prototype)" />
        <p className="text-sm text-base-content/70 mb-6 max-w-2xl">
          Square (1:1) is the current default. The right column uses a vertical phone frame (9:16),
          common for short-form preview. Footer matches the library gallery (tags, filename, post
          count).
        </p>
        {isLoading ? <p className="text-sm text-base-content/60">Loading library…</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="text-sm text-base-content/70">Add media to the library to compare tiles.</p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Square (1:1)</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-lg">
                {items.map((media, index) => (
                  <MediaTile
                    key={media.id}
                    media={media}
                    tags={tagsByMediaId?.get(media.id) ?? []}
                    index={index}
                    {...galleryTileProps}
                  />
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Phone vertical (9:16)</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-lg">
                {items.map((media, index) => (
                  <MediaTile
                    key={media.id}
                    media={media}
                    tags={tagsByMediaId?.get(media.id) ?? []}
                    index={index}
                    aspectFrameClassName={phoneAspectFrameClassName}
                    {...galleryTileProps}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </PageContainer>
    </MediaDragProvider>
  );
};

export const Route = createFileRoute("/dev/media-tile-aspect")({
  component: MediaTileAspectPrototypePage,
});
