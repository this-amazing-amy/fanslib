import type { Media } from "@fanslib/server/schemas";
import type React from "react";
import type { ComponentProps } from "react";
import { Check, GripVertical } from "lucide-react";
import { cn } from "~/lib/cn";
import { MediaTileLite } from "../MediaTile/MediaTileLite";

type PostingHistory = ComponentProps<typeof MediaTileLite>["postingHistory"];

type MediaSelectionGridProps = {
  combinedMedia: Media[];
  activePreviewId: string | null;
  postingHistoryMap: Map<string, NonNullable<PostingHistory>> | undefined;
  channelId?: string;
  draggedItem: Media | null;
  dragOverIndex: number | null;
  isSelected: (mediaId: string) => boolean;
  onDragStart: (e: React.DragEvent, item: Media) => void;
  onDragOver: (e: React.DragEvent, targetIndex: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, targetItem: Media, targetIndex: number) => void;
  onMediaClick: (e: React.MouseEvent, item: Media, itemIndex: number) => void;
  onMouseEnter: (item: Media) => void;
  onMouseLeave: (item: Media) => void;
};

export const MediaSelectionGrid = ({
  combinedMedia,
  activePreviewId,
  postingHistoryMap,
  channelId,
  draggedItem,
  dragOverIndex,
  isSelected,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onMediaClick,
  onMouseEnter,
  onMouseLeave,
}: MediaSelectionGridProps) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
    {combinedMedia.map((item, index) => {
      const itemIsSelected = isSelected(item.id);
      const postingHistory = postingHistoryMap?.get(item.id);

      const isDragging = draggedItem?.id === item.id;
      const isDragOver = dragOverIndex === index;

      return (
        <div
          key={item.id}
          className={cn(
            "relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all",
            itemIsSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary",
            isDragging && "opacity-50",
            isDragOver && "ring-2 ring-primary ring-offset-2",
          )}
          draggable={itemIsSelected}
          onDragStart={(e) => onDragStart(e, item)}
          onDragOver={(e) => onDragOver(e, index)}
          onDragEnd={onDragEnd}
          onDrop={(e) => onDrop(e, item, index)}
          onClick={(e) => onMediaClick(e, item, index)}
          onMouseEnter={() => onMouseEnter(item)}
          onMouseLeave={() => onMouseLeave(item)}
        >
          <MediaTileLite
            media={item}
            isActivePreview={item.id === activePreviewId}
            postingHistory={postingHistory}
            currentChannelId={channelId}
          />
          {itemIsSelected && (
            <>
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
              <div className="drag-handle absolute top-1 left-1 w-6 h-6 rounded bg-base-100/90 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-base-content/70" />
              </div>
            </>
          )}
        </div>
      );
    })}
  </div>
);
