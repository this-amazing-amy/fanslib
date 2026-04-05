import type { Media, MediaTag } from "@fanslib/server/schemas";

export type RepostStatus = "never_posted" | "repostable" | "on_cooldown" | "still_growing";

export type MediaTileProps = {
  media: Media;
  index: number;
  tags?: MediaTag[];
  repostStatus?: RepostStatus;
  className?: string;

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
  aspectFrameClassName?: string;
  onMediaClick?: (media: Media) => void;
};
