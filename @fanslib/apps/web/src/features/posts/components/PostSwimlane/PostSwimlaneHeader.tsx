import { Eye, GripVertical } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { cn } from "~/lib/cn";

type Channel = { id: string; name: string; typeId: string };

type PostSwimlaneHeaderProps = {
  channels: Channel[];
};

export const PostSwimlaneHeader = ({ channels }: PostSwimlaneHeaderProps) => {
  const { preferences, updatePreferences } = usePostPreferences();
  const [draggedChannelId, setDraggedChannelId] = useState<string | null>(null);
  const [dragOverChannelId, setDragOverChannelId] = useState<string | null>(null);

  const hiddenChannels = preferences.view.swimlane?.hiddenChannels ?? [];
  const savedChannelOrder = preferences.view.swimlane?.channelOrder;

  // Apply saved order or use default
  const orderedChannels = savedChannelOrder && savedChannelOrder.length > 0
    ? savedChannelOrder
        .map((id) => channels.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined)
        .concat(channels.filter((c) => !savedChannelOrder.includes(c.id)))
    : channels;

  // Filter to only visible channels
  const visibleChannels = orderedChannels.filter((c) => !hiddenChannels.includes(c.id));

  const toggleChannelVisibility = (channelId: string) => {
    const isHidden = hiddenChannels.includes(channelId);
    const newHiddenChannels = isHidden
      ? hiddenChannels.filter((id) => id !== channelId)
      : [...hiddenChannels, channelId];

    updatePreferences({
      view: {
        swimlane: {
          ...preferences.view.swimlane,
          hiddenChannels: newHiddenChannels,
        },
      },
    });
  };

  const handleDragStart = (e: React.DragEvent, channelId: string) => {
    setDraggedChannelId(channelId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", channelId);
  };

  const handleDragOver = (e: React.DragEvent, channelId: string) => {
    e.preventDefault();
    if (draggedChannelId && draggedChannelId !== channelId) {
      e.dataTransfer.dropEffect = "move";
      setDragOverChannelId(channelId);
    }
  };

  const handleDragLeave = () => {
    setDragOverChannelId(null);
  };

  const handleDrop = (e: React.DragEvent, targetChannelId: string) => {
    e.preventDefault();
    if (!draggedChannelId || draggedChannelId === targetChannelId) {
      setDraggedChannelId(null);
      setDragOverChannelId(null);
      return;
    }

    const defaultOrder = channels.map((c) => c.id);
    const savedOrder = savedChannelOrder ?? defaultOrder;
    const currentOrder = [...savedOrder];
    const draggedIndex = currentOrder.indexOf(draggedChannelId);
    const targetIndex = currentOrder.indexOf(targetChannelId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChannelId(null);
      setDragOverChannelId(null);
      return;
    }

    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedChannelId);

    // Ensure all channels are in the order (append any missing)
    channels.forEach((c) => {
      if (!currentOrder.includes(c.id)) {
        currentOrder.push(c.id);
      }
    });

    updatePreferences({
      view: {
        swimlane: {
          ...preferences.view.swimlane,
          channelOrder: currentOrder,
        },
      },
    });

    setDraggedChannelId(null);
    setDragOverChannelId(null);
  };

  const handleDragEnd = () => {
    setDraggedChannelId(null);
    setDragOverChannelId(null);
  };

  return (
    <div
      className="grid gap-2 pb-2 border-b-2 border-base-300 sticky top-0 bg-base-100 z-10"
      style={{
        gridTemplateColumns: `120px repeat(${visibleChannels.length}, minmax(140px, 1fr))`,
      }}
    >
      {/* Empty cell for date column */}
      <div className="px-3" />

      {/* Visible channel headers */}
      {visibleChannels.map((channel) => {
        const isDragging = draggedChannelId === channel.id;
        const isDragOver = dragOverChannelId === channel.id;

        return (
          <div
            key={channel.id}
            className={cn(
              "flex items-center justify-center gap-1 px-2 group relative",
              isDragging && "opacity-50",
              isDragOver && "ring-2 ring-primary/50 rounded"
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, channel.id)}
            onDragOver={(e) => handleDragOver(e, channel.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, channel.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical
              className={cn(
                "w-3 h-3 text-base-content/30 cursor-grab active:cursor-grabbing",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            />
            <ChannelBadge
              name={channel.name}
              typeId={channel.typeId}
              size="sm"
              selected
              borderStyle="none"
              className="justify-center"
              responsive={false}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleChannelVisibility(channel.id);
              }}
              className={cn(
                "p-0.5 rounded transition-opacity",
                "opacity-0 group-hover:opacity-100",
                "text-base-content/40"
              )}
              title="Hide channel"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

