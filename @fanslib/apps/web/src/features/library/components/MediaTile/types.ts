import { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;

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
