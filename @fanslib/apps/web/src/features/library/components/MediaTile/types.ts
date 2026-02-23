import type { Media, MediaTag } from '@fanslib/server/schemas';

export type MediaTileProps = {
  media: Media;
  index: number;
  tags?: MediaTag[];
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
  onMediaClick?: (media: Media) => void;
};
