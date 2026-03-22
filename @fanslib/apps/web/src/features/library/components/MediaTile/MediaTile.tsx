import { memo, useId, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useMediaHoverStore } from "~/stores/mediaHoverStore";
import { useMediaSelectionStore } from "~/stores/mediaSelectionStore";
import { cn } from "~/lib/cn";
import { MediaTileImage } from "./MediaTileImage";
import { MediaTilePostsPopover } from "./MediaTilePostsPopover";
import { MediaTileSelectionCircle } from "./MediaTileSelectionCircle";
import { MediaTileTagBadges } from "./MediaTileTagBadges";
import { MediaTileTypeSticker } from "./MediaTileTypeSticker";
import { MediaTileVideo } from "./MediaTileVideo";
import type { MediaTileProps } from "./types";

import type { RepostStatus } from "./types";

const REPOST_STATUS_CONFIG: Record<
  RepostStatus,
  { color: string; label: string; tooltip: string }
> = {
  repostable: { color: "bg-green-500", label: "R", tooltip: "Repostable" },
  on_cooldown: { color: "bg-yellow-500", label: "C", tooltip: "On Cooldown" },
  still_growing: { color: "bg-blue-500", label: "G", tooltip: "Still Growing" },
  never_posted: { color: "bg-gray-400", label: "N", tooltip: "Never Posted" },
};

export const MediaTile = memo((props: MediaTileProps) => {
  const { media, tags = [] } = props;

  const navigate = useNavigate();
  const { startMediaDrag, endMediaDrag } = useMediaDrag();

  const flattenedMedia = useMediaSelectionStore((s) => s.flattenedMedia);
  const selectedIds = useMediaSelectionStore((s) => s.selectedIds);
  const isShiftPressed = useMediaSelectionStore((s) => s.isShiftPressed);
  const lastClickedIndex = useMediaSelectionStore((s) => s.lastClickedIndex);
  const toggleItem = useMediaSelectionStore((s) => s.toggleItem);
  const selectRange = useMediaSelectionStore((s) => s.selectRange);

  const instanceId = useId();
  const setHovered = useMediaHoverStore((s) => s.setHovered);
  const hoveredMediaId = useMediaHoverStore((s) => s.hoveredMediaId);

  const withPostsPopover = props.withPostsPopover ?? false;
  const withPreview = props.withPreview ?? false;
  const withSelection = props.withSelection ?? false;
  const withDragAndDrop = props.withDragAndDrop ?? false;
  const withDuration = props.withDuration ?? false;
  const withTypeIcon = props.withTypeIcon ?? false;
  const withNavigation = props.withNavigation ?? false;
  const withTags = props.withTags ?? false;
  const withFileName = props.withFileName ?? false;
  const withRepostStatus = props.withRepostStatus ?? false;
  const { onMediaClick } = props;

  const isHighlighted = useMemo(() => {
    if (lastClickedIndex === null || !hoveredMediaId) return false;
    if (selectedIds.size === 0 || !isShiftPressed) return false;
    const hoveredItem = flattenedMedia.find((m) => m.media.id === hoveredMediaId);
    const currentItem = flattenedMedia.find((m) => m.media.id === media.id);
    if (!hoveredItem || !currentItem) return false;
    return (
      currentItem.globalIndex >= Math.min(lastClickedIndex, hoveredItem.globalIndex) &&
      currentItem.globalIndex <= Math.max(lastClickedIndex, hoveredItem.globalIndex)
    );
  }, [
    lastClickedIndex,
    hoveredMediaId,
    selectedIds.size,
    isShiftPressed,
    flattenedMedia,
    media.id,
  ]);

  const activatePreview = () => {
    if (!withPreview) return;
    setHovered(media.id, instanceId);
  };

  const deactivatePreview = () => {
    if (!withPreview) return;
    setHovered(null, null);
  };

  const currentItem = flattenedMedia.find((m) => m.media.id === media.id);

  const selectOrNavigate = () => {
    if (withSelection && currentItem) {
      if (isShiftPressed && lastClickedIndex !== null) {
        selectRange(currentItem.globalIndex);
        return;
      }

      if (selectedIds.size > 0) {
        toggleItem(media.id, currentItem.globalIndex);
        return;
      }
    }

    if (onMediaClick) {
      onMediaClick(media);
      return;
    }

    if (withNavigation) {
      navigate({ to: "/content/library/media/$mediaId", params: { mediaId: media.id } });
    }
  };

  const isSelected = selectedIds.has(media.id);

  const selectedItems = useMemo(
    () => flattenedMedia.filter((m) => selectedIds.has(m.media.id)).map((m) => m.media),
    [flattenedMedia, selectedIds],
  );

  const dragAndDropProps = withDragAndDrop && {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
      const itemsToDrag = selectedIds.has(media.id) ? selectedItems : [media];
      startMediaDrag(e, itemsToDrag);
    },
    onDragEnd: endMediaDrag,
  };

  const hasFooter = withTags || withFileName || withPostsPopover || withTypeIcon;

  const content = (
    <div
      className={cn(
        "flex flex-col bg-white rounded-lg overflow-hidden group border cursor-pointer",
        isHighlighted && "ring-2 ring-primary border-primary",
        isSelected ? "ring-2 ring-primary border-primary" : "border-black",
        props.className,
      )}
      style={withNavigation ? { viewTransitionName: `media-${media.id}` } : undefined}
      onMouseEnter={activatePreview}
      onMouseLeave={deactivatePreview}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".selection-circle")) return;
        selectOrNavigate();
      }}
      {...dragAndDropProps}
    >
      <div className="relative aspect-square overflow-hidden">
        {media.type === "video" && (
          <MediaTileVideo
            media={media}
            withPreview={withPreview}
            withDuration={withDuration}
            cover={true}
            hoverKey={instanceId}
          />
        )}
        {media.type === "image" && <MediaTileImage media={media} cover={true} />}
        {withSelection && (
          <MediaTileSelectionCircle
            mediaId={media.id}
            globalIndex={currentItem?.globalIndex ?? 0}
          />
        )}
        {withRepostStatus && props.repostStatus && REPOST_STATUS_CONFIG[props.repostStatus] && (
          <div
            className={cn(
              "absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full border border-white/50",
              REPOST_STATUS_CONFIG[props.repostStatus].color,
            )}
            title={REPOST_STATUS_CONFIG[props.repostStatus].tooltip}
          />
        )}
        {media.excluded && (
          <div
            className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold leading-none px-1 py-0.5 rounded"
            title="Excluded from posting"
          >
            EX
          </div>
        )}
      </div>
      {hasFooter && (
        <div className="flex flex-col gap-2 px-3 pt-3 pb-3 bg-white">
          {(withTags || withPostsPopover || withTypeIcon) && (
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {withTags && <MediaTileTagBadges tags={tags} />}
                {withTypeIcon && <MediaTileTypeSticker media={media} />}
              </div>
              {withPostsPopover && <MediaTilePostsPopover media={media} />}
            </div>
          )}
          {withFileName && (
            <span
              className="text-xs text-base-content/90 truncate leading-tight"
              style={{ direction: "rtl" }}
            >
              {media.name}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
});

MediaTile.displayName = "MediaTile";
