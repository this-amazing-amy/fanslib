import type { Media } from "@fanslib/types";

export type MediaTileProps = {
  media: Media;
  allMedias: Media[];
  index: number;
  className?: string;

  withPostsPopover?: boolean;
  withSelection?: boolean;
  withNavigation?: boolean;
  withDragAndDrop?: boolean;
  withPreview?: boolean;
  withTags?: boolean;

  withDuration?: boolean;
  withTypeIcon?: boolean;
  withFileName?: boolean;

  cover?: boolean;
};
