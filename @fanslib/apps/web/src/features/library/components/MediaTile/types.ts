import type { Media } from '@fanslib/server/schemas';


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
