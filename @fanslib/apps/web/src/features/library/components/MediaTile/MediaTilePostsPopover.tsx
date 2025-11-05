import type { Media } from "@fanslib/types";

type PostsPopoverProps = {
  media: Media;
};

// TODO: This component needs to be properly implemented once:
// 1. Media type includes postMedia relations
// 2. ChannelBadge component is ported
// 3. StatusSticker component is ported
// 4. Proper Popover/Tooltip infrastructure is available
export const MediaTilePostsPopover = ({ media: _media }: PostsPopoverProps) => null;
