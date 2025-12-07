import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { X } from "lucide-react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { StatusIcon } from "~/components/StatusIcon";
import { usePostDrag } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { cn } from "~/lib/cn";
import { getPostStatusBorderColor } from "~/lib/colors";
import { useSkipScheduleSlotMutation } from "~/lib/queries/content-schedules";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostCalendarDropzone } from "./PostCalendarDropzone";
import { PostCalendarPostMedia } from "./PostCalendarPostMedia";

type Post = typeof PostWithRelationsSchema.static;

type PostCalendarPostProps = {
  post: Post | VirtualPost;
  onUpdate?: () => Promise<void>;
};

export const PostCalendarPost = ({ post, onUpdate }: PostCalendarPostProps) => {
  const { startPostDrag, endPostDrag } = usePostDrag();
  const time = format(new Date(post.date), "HH:mm");
  const { preferences } = usePostPreferences();
  const skipSlotMutation = useSkipScheduleSlotMutation();

  const dragProps = !isVirtualPost(post)
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => startPostDrag(e, post),
        onDragEnd: endPostDrag,
      }
    : {};

  const status = post.status ?? 'draft';
  const borderColor = getPostStatusBorderColor(status as 'posted' | 'scheduled' | 'draft');

  const handleSkip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isVirtualPost(post)) return;
    
    await skipSlotMutation.mutateAsync({
      scheduleId: post.scheduleId,
      date: post.date,
    });
    
    if (onUpdate) {
      await onUpdate();
    }
  };

  const content = (
    <div
      {...dragProps}
      className={cn(
        "group flex flex-col transition-all duration-200 relative",
        "p-2.5 rounded-xl bg-base-100 border-2 shadow-sm hover:shadow-md",
        {
          "cursor-grab active:cursor-grabbing": !isVirtualPost(post),
        }
      )}
      style={{
        borderColor,
      }}
    >
      {/* Skip Button (only for virtual posts) */}
      {isVirtualPost(post) && (
        <button
          onClick={handleSkip}
          className={cn(
            "absolute top-1 right-1 p-1 rounded-md",
            "bg-base-200/80 hover:bg-base-300 text-base-content/60 hover:text-base-content",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "z-10"
          )}
          title="Skip this slot"
        >
          <X size={14} />
        </button>
      )}

      {/* Schedule Badge */}
      {(isVirtualPost(post) || post.schedule) && (
        <ContentScheduleBadge
          name={isVirtualPost(post) ? post.schedule.name : post.schedule?.name ?? ""}
          emoji={isVirtualPost(post) ? post.schedule.emoji : post.schedule?.emoji}
          color={isVirtualPost(post) ? post.schedule.color : post.schedule?.color}
          size="sm"
          className="w-full justify-center mb-1 opacity-40 group-hover:opacity-100 transition-opacity"
        />
      )}

      {/* Channel Badge */}
      <ChannelBadge
        name={post.channel.name ?? ""}
        typeId={post.channel.type?.id ?? post.channel.typeId}
        size="sm"
        className="w-full justify-center mb-2 opacity-40 group-hover:opacity-100 transition-opacity"
      />

      {/* Metadata Row: Status + Time */}
      <div className="flex items-center justify-between mb-2">
        <StatusIcon status={status as 'posted' | 'scheduled' | 'draft'} />
        <div className="text-xs font-medium text-base-content/60">{time}</div>
      </div>

      {/* Media Section */}
      <div className="mb-1.5">
        <PostCalendarPostMedia
          postMedia={isVirtualPost(post) ? [] : post.postMedia}
          isVirtual={isVirtualPost(post)}
        />
      </div>

      {/* Caption (optional, hidden on mobile) */}
      {preferences.view.showCaptions && post.caption && (
        <div className="text-[10px] leading-snug text-base-content/50 pt-1 line-clamp-2 hidden sm:block">
          {post.caption}
        </div>
      )}
    </div>
  );

  const wrappedContent = isVirtualPost(post) ? (
    content
  ) : (
    <Link to="/posts/$postId" params={{ postId: post.id }} className="block">
      {content}
    </Link>
  );

  return (
    <PostCalendarDropzone post={post} onUpdate={onUpdate}>
      {wrappedContent}
    </PostCalendarDropzone>
  );
};
