import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Post } from "@fanslib/types";
import { ChannelBadge } from "~/components/ChannelBadge";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { PostTagStickers } from "~/components/PostTagStickers";
import { usePlanPreferences } from "~/contexts/PlanPreferencesContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostCalendarDropzone } from "./PostCalendarDropzone";
import { PostCalendarPostMedia } from "./PostCalendarPostMedia";

type PostCalendarPostProps = {
  post: Post | VirtualPost;
  onUpdate?: () => Promise<void>;
};

export const PostCalendarPost = ({ post, onUpdate }: PostCalendarPostProps) => {
  const { startPostDrag, endPostDrag } = usePostDrag();
  const time = format(new Date(post.date), "h:mm a");
  const { preferences } = usePlanPreferences();

  const dragProps = !isVirtualPost(post)
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => startPostDrag(e, post),
        onDragEnd: endPostDrag,
      }
    : {};

  const content = (
    <div
      {...dragProps}
      className={cn(
        "grid align-start [grid-template-areas:'stickers_time''media_media''captions_captions'] grid-cols-[auto_1fr] transition-colors",
        "gap-x-2 gap-y-2",
        "p-3 rounded-md border border-base-300 border-b-3 shadow-sm hover:shadow-lg transition-all hover:scale-[1.01]",
        {
          "border-b-success": post.status === "posted",
          "border-b-info": post.status === "scheduled",
          "border-b-base-content/30": post.status === "draft",
          "cursor-grab active:cursor-grabbing": !isVirtualPost(post),
        },
        {
          "min-h-24 grid-rows-[auto_1fr]": !preferences.view.showCaptions,
          "min-h-48 grid-rows-[auto_1.5fr_1fr]": preferences.view.showCaptions,
        }
      )}
    >
      <div className="[grid-area:stickers] flex gap-1">
        <ChannelBadge
          noName
          name=""
          typeId={post.channel.type?.id || post.channel.typeId}
          size="sm"
        />
        {isVirtualPost(post) ? (
          <MediaFilterSummary mediaFilters={post.mediaFilters} layout="stacked" />
        ) : (
          <PostTagStickers postMedia={post.postMedia} />
        )}
      </div>
      <div className="[grid-area:time] text-xs text-base-content/60">{time}</div>
      <div className="[grid-area:media] relative">
        <PostCalendarPostMedia
          postMedia={isVirtualPost(post) ? [] : post.postMedia}
          isVirtual={isVirtualPost(post)}
        />
      </div>
      {preferences.view.showCaptions && (
        <div className="[grid-area:captions] text-xs text-base-content/60">
          {post.caption?.slice(0, 50)}
          {post.caption && post.caption.length > 50 && "..."}
        </div>
      )}
    </div>
  );

  return (
    <PostCalendarDropzone post={post} onUpdate={onUpdate}>
      {isVirtualPost(post) ? (
        content
      ) : (
        <Link to="/posts/$postId" params={{ postId: post.id }} className="block" draggable={false}>
          {content}
        </Link>
      )}
    </PostCalendarDropzone>
  );
};

