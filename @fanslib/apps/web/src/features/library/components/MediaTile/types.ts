import type { Media, MediaTag } from "@fanslib/server/schemas";

export type RepostStatus = "never_posted" | "repostable" | "on_cooldown" | "still_growing";

export type MediaTileProps = {
  media: Media;
  index: number;
  tags?: MediaTag[];
  repostStatus?: RepostStatus;
  className?: string;
  /** Replaces default `aspect-square` on the media frame (e.g. `aspect-[9/16]` for phone preview). */
  aspectFrameClassName?: string;

  withPostsPopover?: boolean;
  withSelection?: boolean;
  withNavigation?: boolean;
  withDragAndDrop?: boolean;
  withPreview?: boolean;
  withTags?: boolean;
  withRepostStatus?: boolean;

  withDuration?: boolean;
  withTypeIcon?: boolean;
  withFileName?: boolean;

  cover?: boolean;
  onMediaClick?: (media: Media) => void;
};
