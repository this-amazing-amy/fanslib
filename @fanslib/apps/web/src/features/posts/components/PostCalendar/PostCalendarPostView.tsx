import { format } from "date-fns";
import type { ReactNode } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { StatusIcon } from "~/components/StatusIcon";
import { getPostStatusBorderColor } from "~/lib/colors";

type PostCalendarPostViewProps = {
  // Core data
  date: Date;
  status: 'posted' | 'scheduled' | 'draft';
  channel: {
    name: string;
    typeId: string;
  };
  
  // Optional data
  schedule?: {
    name: string;
    emoji?: string;
    color?: string;
  };
  caption?: string;
  showCaption?: boolean;
  
  // Rendering slots
  mediaSlot: ReactNode;
  overlaySlot?: ReactNode;
  actionSlot?: ReactNode;
  
  // Event handlers
  onMouseLeave?: () => void;
  
  // Wrapper (for drag/link behavior)
  wrapper?: (children: ReactNode) => ReactNode;
};

export const PostCalendarPostView = ({
  date,
  status,
  channel,
  schedule,
  caption,
  showCaption = true,
  mediaSlot,
  overlaySlot,
  actionSlot,
  onMouseLeave,
  wrapper,
}: PostCalendarPostViewProps) => {
  const time = format(date, "HH:mm");

  const content = (
    <div
      className="@container group flex flex-col transition-all duration-200 relative p-2 @[150px]:p-2.5 @[180px]:p-3 rounded-xl bg-base-100 border"
      onMouseLeave={onMouseLeave}
    >
      {/* Overlay slot (e.g., virtual post overlay) */}
      {overlaySlot}
      
      {/* Action slot (e.g., skip button) */}
      {actionSlot}

      {/* Media Section */}
      <div className="mb-1 @[150px]:mb-1.5 overflow-hidden rounded-xl">
        {mediaSlot}
      </div>

      {/* Badges Row - always side by side, hide text on tight spaces */}
      <div className="@container flex flex-row gap-0.5 @[150px]:gap-1 mb-1 @[150px]:mb-1.5">
        {/* Channel Badge */}
        <ChannelBadge
          name={channel.name}
          typeId={channel.typeId}
          size="sm"
          selected
          borderStyle="none"
          className="justify-center"
        />

        {/* Schedule Badge */}
        {schedule && (
          <ContentScheduleBadge
            name={schedule.name}
            emoji={schedule.emoji}
            color={schedule.color}
            size="sm"
            selected
            borderStyle="none"
            className="justify-center"
          />
        )}
      </div>

      {/* Metadata Row: Status + Time */}
      <div className="flex items-center justify-between mb-0.5 @[150px]:mb-1">
        <StatusIcon status={status} />
        <div className="text-sm @[180px]:text-base font-bold text-base-content">{time}</div>
      </div>

      {/* Caption (optional, hidden on mobile) */}
      {showCaption && caption && (
        <div className="text-[10px] leading-snug text-base-content line-clamp-2 hidden sm:block">
          {caption}
        </div>
      )}
    </div>
  );

  return wrapper ? wrapper(content) : content;
};
