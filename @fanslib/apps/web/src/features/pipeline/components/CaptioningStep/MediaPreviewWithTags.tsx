import type { Media } from "@fanslib/server/schemas";
import { MediaView } from "~/components/MediaView";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { TagBadge } from "~/features/library/components/MediaTagEditor/DimensionTagSelector/TagBadge";

/** Minimal media tag shape needed for display. */
export type MediaTagResult = {
  id: number;
  tagDefinitionId: number;
  color: string | null;
  stickerDisplay: string;
  shortRepresentation: string | null;
  tagDisplayName: string;
  tagValue: string;
};

type PostMediaItem = {
  id: string;
  media: Media;
};

type MediaPreviewWithTagsProps = {
  postMedia: PostMediaItem[];
  /** Query results whose data arrays contain at least the MediaTagResult fields. */
  mediaTagQueries: { data?: MediaTagResult[] | undefined }[];
};

export const MediaPreviewWithTags = ({ postMedia, mediaTagQueries }: MediaPreviewWithTagsProps) => {
  if (postMedia.length === 0) return null;

  return (
    <div className="space-y-3">
      {postMedia.map((pm, index) => {
        const media = pm.media;
        const mediaTags = mediaTagQueries[index]?.data ?? [];

        return (
          <div key={pm.id} className="flex gap-4 items-start">
            <div className="w-full aspect-square max-w-xs flex-shrink-0">
              {media.type === "video" ? (
                <MediaView media={media as unknown as Media} controls />
              ) : (
                <MediaTileLite media={media as unknown as Media} />
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {mediaTags
                .filter((tag) => tag.stickerDisplay && tag.stickerDisplay !== "none")
                .map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={{
                      id: tag.tagDefinitionId,
                      color: tag.color,
                      displayName:
                        tag.shortRepresentation ?? tag.tagDisplayName ?? tag.tagValue,
                    }}
                    size="md"
                    selectionMode="radio"
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
