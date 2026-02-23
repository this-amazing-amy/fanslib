import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useMediaSelection } from "~/contexts/MediaSelectionContext";
import { useMediaHoverStore } from "~/stores/mediaHoverStore";
import { cn } from "~/lib/cn";
import { MediaTileImage } from "./MediaTileImage";
import { MediaTilePostsPopover } from "./MediaTilePostsPopover";
import { MediaTileSelectionCircle } from "./MediaTileSelectionCircle";
import { MediaTileTagBadges } from "./MediaTileTagBadges";
import { MediaTileTypeSticker } from "./MediaTileTypeSticker";
import { MediaTileVideo } from "./MediaTileVideo";
import type { MediaTileProps } from "./types";

export const MediaTile = memo((props: MediaTileProps) => {
  const { media, tags = [] } = props;

  const { startMediaDrag, endMediaDrag } = useMediaDrag();
  const { selectedMediaIds, selectedMediaItems, flattenedMedia, lastClickedIndex, isShiftPressed, toggleMediaSelection } =
    useMediaSelection();
  const setHoveredMediaId = useMediaHoverStore((s) => s.setHoveredMediaId);
  const hoveredMediaId = useMediaHoverStore((s) => s.hoveredMediaId);

  const withPostsPopover = props.withPostsPopover ?? false;
  const withPreview = props.withPreview ?? false;
  const withSelection = props.withSelection ?? false;
  const withDragAndDrop = props.withDragAndDrop ?? false;
  const withDuration = props.withDuration ?? false;
  const withTypeIcon = props.withTypeIcon ?? false;
  const withNavigation = props.withNavigation ?? false;
  const cover = props.cover ?? false;
  const withTags = props.withTags ?? false;
  const { onMediaClick } = props;

  const isHighlighted = useMemo(() => {
    if (lastClickedIndex === null || !hoveredMediaId) return false;
    if (selectedMediaIds.size === 0 || !isShiftPressed) return false;
    const hoveredItem = flattenedMedia.find((m) => m.media.id === hoveredMediaId);
    const currentItem = flattenedMedia.find((m) => m.media.id === media.id);
    if (!hoveredItem || !currentItem) return false;
    return (
      currentItem.globalIndex >= Math.min(lastClickedIndex, hoveredItem.globalIndex) &&
      currentItem.globalIndex <= Math.max(lastClickedIndex, hoveredItem.globalIndex)
    );
  }, [lastClickedIndex, hoveredMediaId, selectedMediaIds.size, isShiftPressed, flattenedMedia, media.id]);

  const activatePreview = () => {
    if (!withPreview) return;
    setHoveredMediaId(media.id);
  };

  const deactivatePreview = () => {
    if (!withPreview) return;
    setHoveredMediaId(null);
  };

  const selectOrNavigate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (withSelection && selectedMediaIds.size > 0) {
      toggleMediaSelection(media.id, e);
      return;
    }

    const isSelectionCircleClicked = (e.target as HTMLElement).closest(".selection-circle");
    if (isSelectionCircleClicked) {
      e.preventDefault();
      return;
    }

    if (onMediaClick) {
      e.preventDefault();
      onMediaClick(media);
    }
  };

  const isSelected = selectedMediaIds.has(media.id);

  const dragAndDropProps = withDragAndDrop && {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
      const itemsToDrag = selectedMediaIds.has(media.id) ? selectedMediaItems : [media];
      startMediaDrag(e, itemsToDrag);
    },
    onDragEnd: endMediaDrag,
  };

  const content = (
    <div
      className={cn(
        "relative aspect-square bg-base-300 rounded-lg overflow-hidden group",
        (withNavigation || (withSelection && selectedMediaIds.size > 0)) && "cursor-pointer",
        isHighlighted && "ring-2 ring-primary/50",
        isSelected && "ring-2 ring-primary/50",
        props.className
      )}
      style={withNavigation ? { viewTransitionName: `media-${media.id}` } : undefined}
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
        {withTags && <MediaTileTagBadges tags={tags} />}
        {withTypeIcon && <MediaTileTypeSticker media={media} />}
      </div>
    </div>
  );

  if (!withNavigation || onMediaClick) return content;

  return (
    <Link to="/content/library/media/$mediaId" params={{ mediaId: media.id }}>
      {content}
    </Link>
  );
});

MediaTile.displayName = "MediaTile";
