import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import type { PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { Camera } from "lucide-react";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { StatusIcon } from "~/components/StatusIcon";
import { usePostDrag } from "~/contexts/PostDragContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { getCaptionPreview } from "~/features/posts/lib/captions";
import { useVirtualPostClick } from "~/features/posts/hooks/useVirtualPostClick";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useCreatePostDialog } from "./CreatePostDialogContext";

type Post = PostWithRelations;

type PostSwimlaneCardProps = {
  post: Post | VirtualPost;
};

export const PostSwimlaneCard = ({ post }: PostSwimlaneCardProps) => {
  const isVirtual = isVirtualPost(post);
  const time = format(new Date(post.date), "HH:mm");
  const status = post.status ?? "draft";
  const { startPostDrag, endPostDrag } = usePostDrag();
  const captionPreview = post.caption ? getCaptionPreview(post.caption, { maxChars: 80 }) : "";
  const { openCreatePostDialog } = useCreatePostDialog();

  const virtualPostClick = useVirtualPostClick({
    post: isVirtual ? post : ({} as VirtualPost),
    onOpenCreateDialog: (data) =>
      openCreatePostDialog({
        media: data.media,
        initialDate: data.initialDate,
        initialChannelId: data.initialChannelId,
        scheduleId: data.scheduleId,
        initialMediaSelectionExpanded: data.initialMediaSelectionExpanded,
      }),
  });

  const mediaContent = isVirtual ? (
    <div className="w-12 h-12 rounded-md border-2 border-dashed border-base-300 bg-base-200/30 flex items-center justify-center">
      <Camera className="w-4 h-4 text-base-content/20" />
    </div>
  ) : (
    <MediaSelectionProvider media={post.postMedia.map((pm) => pm.media)}>
      {post.postMedia[0] && (
        <MediaTile
          media={post.postMedia[0].media}
          allMedias={post.postMedia.map((pm) => pm.media)}
          index={0}
          className="w-12 h-12 rounded-md"
          withPreview
          cover
        />
      )}
    </MediaSelectionProvider>
  );

  const schedule = isVirtual
    ? post.schedule
    : post.schedule
      ? {
          name: post.schedule.name,
          emoji: post.schedule.emoji ?? undefined,
          color: post.schedule.color ?? undefined,
        }
      : undefined;

  const content = (
    <div
      className={cn(
        "relative grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-1.5 p-2 rounded-lg border border-base-content bg-base-100",
        isVirtual && "opacity-60 border-dashed cursor-pointer"
      )}
      onClick={isVirtual ? virtualPostClick.handleClick : undefined}
    >
      {/* Media - spans 2 rows */}
      <div className="row-span-2 flex-shrink-0">{mediaContent}</div>

      {/* Row 1: Status + Time, Caption */}
      <div className="flex items-start gap-2">
        <StatusIcon status={status as "posted" | "scheduled" | "draft"} />
        <span className="text-xs font-semibold text-base-content">{time}</span>
      </div>
      {captionPreview ? (
        <div className="row-span-2 flex items-start min-w-0">
          <span className="text-[10px] leading-snug text-base-content/70 line-clamp-2">
            {captionPreview}
          </span>
        </div>
      ) : (
        <div className="row-span-2" />
      )}

      {/* Row 2: Schedule badge */}
      {schedule ? (
        <div className="flex items-center">
          <ContentScheduleBadge
            name={schedule.name}
            emoji={schedule.emoji}
            color={schedule.color}
            size="sm"
            selected
            borderStyle="none"
            className="justify-center"
            responsive={false}
          />
        </div>
      ) : (
        <div />
      )}
    </div>
  );

  const dragProps = isVirtual
    ? {}
    : {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => startPostDrag(e, post as Post),
        onDragEnd: endPostDrag,
      };

  if (isVirtual) {
    return <div>{content}</div>;
  }

  return (
    <Link
      to="/posts/$postId"
      params={{ postId: post.id }}
      className="block cursor-grab active:cursor-grabbing"
    >
      <div {...dragProps}>{content}</div>
    </Link>
  );
};

