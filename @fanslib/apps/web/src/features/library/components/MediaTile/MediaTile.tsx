import { Link } from "@tanstack/react-router";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useMediaSelection } from "~/contexts/MediaSelectionContext";
import { cn } from "~/lib/cn";
import { MediaFileFilenameTooltip } from "./MediaTileFilenameTooltip";
import { MediaTileImage } from "./MediaTileImage";
import { MediaTilePostsPopover } from "./MediaTilePostsPopover";
import { MediaTileSelectionCircle } from "./MediaTileSelectionCircle";
import { MediaTileTagStickers } from "./MediaTileTagStickers";
import { MediaTileTypeSticker } from "./MediaTileTypeSticker";
import { MediaTileVideo } from "./MediaTileVideo";
import type { MediaTileProps } from "./types";

export const MediaTile = (props: MediaTileProps) => {
  const { media, allMedias } = props;

  const { startMediaDrag, endMediaDrag } = useMediaDrag();
  const { setCurrentHoveredMediaId, isHighlighted, selectedMediaIds, toggleMediaSelection } =
    useMediaSelection();

  const withPostsPopover = props.withPostsPopover ?? false;
  const withPreview = props.withPreview ?? false;
  const withSelection = props.withSelection ?? false;
  const withDragAndDrop = props.withDragAndDrop ?? false;
  const withDuration = props.withDuration ?? false;
  const withTypeIcon = props.withTypeIcon ?? false;
  const withNavigation = props.withNavigation ?? false;
  const withFileName = props.withFileName ?? false;
  const cover = props.cover ?? false;
  const withTags = props.withTags ?? false;

  const activatePreview = () => {
    if (!withPreview) return;
    setCurrentHoveredMediaId(media.id);
  };

  const deactivatePreview = () => {
    if (!withPreview) return;
    setCurrentHoveredMediaId(null);
  };

  const selectOrNavigate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (withSelection && selectedMediaIds.size > 0) {
      toggleMediaSelection(media.id, e);
      return;
    }

    const isSelectionCircleClicked = (e.target as HTMLElement).closest(".selection-circle");
    if (!isSelectionCircleClicked && withNavigation) {
      // Note: Navigation will be handled by the Link wrapper when enabled
      e.preventDefault();
    }
  };

  const isSelected = selectedMediaIds.has(media.id);

  const dragAndDropProps = withDragAndDrop && {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
      const selectedItems = selectedMediaIds.has(media.id)
        ? allMedias.filter((m) => selectedMediaIds.has(m.id))
        : [media];
      startMediaDrag(e, selectedItems);
    },
    onDragEnd: endMediaDrag,
  };

  const content = (
    <div
      className={cn(
        "relative aspect-square bg-muted rounded-lg overflow-hidden group",
        (withNavigation || (withSelection && selectedMediaIds.size > 0)) && "cursor-pointer",
        isHighlighted(media.id) && "ring-2 ring-primary/50",
        isSelected && "ring-2 ring-primary/50",
        props.className
      )}
      onMouseEnter={activatePreview}
      onMouseLeave={deactivatePreview}
      onClick={selectOrNavigate}
      {...dragAndDropProps}
    >
      {media.type === "video" && (
        <MediaTileVideo
          media={media}
          withPreview={withPreview}
          withDuration={withDuration}
          cover={cover}
        />
      )}
      {media.type === "image" && <MediaTileImage media={media} cover={cover} />}
      {withSelection && <MediaTileSelectionCircle mediaId={media.id} />}
      <div className="absolute bottom-1 left-1 flex gap-1 z-10">
        {withPostsPopover && <MediaTilePostsPopover media={media} />}
        {withTags && <MediaTileTagStickers media={media} />}
        {withTypeIcon && <MediaTileTypeSticker media={media} />}
      </div>
    </div>
  );

  const wrappedContent = withNavigation ? (

    <Link to="/library/$mediaId" params={{ mediaId: media.id }}>
      {content}
    </Link>
  ) : (
    content
  );

  return withFileName ? (
    <MediaFileFilenameTooltip media={media}>{wrappedContent}</MediaFileFilenameTooltip>
  ) : (
    wrappedContent
  );
};
