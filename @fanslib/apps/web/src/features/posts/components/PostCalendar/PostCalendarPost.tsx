import type { Media, PostWithRelations } from '@fanslib/server/schemas';
import { Link } from "@tanstack/react-router";
import { Trash2, X } from "lucide-react";
import { useState, useRef } from "react";
import { usePostDrag } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { VirtualPostMediaPanel } from "~/features/library/components/VirtualPostMediaPanel";
import { cn } from "~/lib/cn";
import { useSkipScheduleSlotMutation } from "~/lib/queries/content-schedules";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useVirtualPostClick } from "../../hooks/useVirtualPostClick";
import { getCaptionPreview } from "../../lib/captions";
import { VirtualPostOverlay } from "../VirtualPostOverlay";
import { PostCalendarDropzone } from "./PostCalendarDropzone";
import { PostCalendarPostMedia } from "./PostCalendarPostMedia";
import { PostCalendarPostView } from "./PostCalendarPostView";

type Post = PostWithRelations;

type PostCalendarPostProps = {
  post: Post | VirtualPost;
  onUpdate?: () => Promise<void>;
  allPosts?: (Post | VirtualPost)[];
};

export const PostCalendarPost = ({ post, onUpdate, allPosts = [] }: PostCalendarPostProps) => {
  const { startPostDrag, endPostDrag } = usePostDrag();
  const { preferences } = usePostPreferences();
  const skipSlotMutation = useSkipScheduleSlotMutation();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const captionPreview = post.caption ? getCaptionPreview(post.caption) : "";
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    initialDate?: Date;
    initialChannelId?: string;
    scheduleId?: string;
    initialMediaSelectionExpanded?: boolean;
    allPosts?: (Post | VirtualPost)[];
    virtualPost?: VirtualPost;
  } | null>(null);

  const [simplifiedPanelOpen, setSimplifiedPanelOpen] = useState(false);
  const [cardBounds, setCardBounds] = useState<DOMRect | undefined>(undefined);
  
  const virtualPostClick = useVirtualPostClick({
    post: isVirtualPost(post) ? post : ({} as VirtualPost),
    onOpenCreateDialog: (data) => {
      if (isVirtualPost(post)) {
        // Open simplified panel for virtual posts
        const bounds = cardRef.current?.getBoundingClientRect();
        setCardBounds(bounds);
        setSimplifiedPanelOpen(true);
      } else {
        // Open full dialog for regular posts
        setCreatePostData({
          ...data,
          allPosts,
          virtualPost: isVirtualPost(post) ? post : undefined,
        });
      }
    },
  });
  
  const closeCreatePostDialog = () => {
    setCreatePostData(null);
    if (onUpdate) {
      onUpdate();
    }
  };
  
  const handleNavigateToSlot = (virtualPost: VirtualPost) => {
    setCreatePostData({
      media: [],
      initialDate: new Date(virtualPost.date),
      initialChannelId: virtualPost.channelId,
      scheduleId: virtualPost.scheduleId ?? undefined,
      initialMediaSelectionExpanded: true,
      allPosts,
      virtualPost,
    });
  };

  const status = post.status ?? 'draft';
  const virtual = isVirtualPost(post);

  // Extract channel typeId safely
  const channelTypeId = post.channel.type?.id ?? post.channel.typeId ?? 'onlyfans';

  const handleSkipClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!virtual) return;
    
    if (!confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    
    if (!post.scheduleId) {
      setConfirmSkip(false);
      return;
    }

    await skipSlotMutation.mutateAsync({
      scheduleId: post.scheduleId,
      date: post.date,
    });
    
    if (onUpdate) {
      await onUpdate();
    }
    
    setConfirmSkip(false);
  };

  // Skip button for virtual posts
  const skipButton = virtual ? (
    <button
      onClick={handleSkipClick}
      className={cn(
        "absolute top-1 right-1 p-1 rounded-md transition-all",
        "opacity-0 group-hover:opacity-100",
        "z-10",
        confirmSkip
          ? "bg-error/80 hover:bg-error text-error-content"
          : "bg-base-200/80 hover:bg-base-300 text-base-content/60 hover:text-base-content"
      )}
      title={confirmSkip ? "Click again to confirm skip" : "Skip this slot"}
    >
      {confirmSkip ? <Trash2 size={14} /> : <X size={14} />}
    </button>
  ) : undefined;

  // Virtual post overlay
  const overlay = virtual ? (
    <VirtualPostOverlay onClick={virtualPostClick.handleClick} />
  ) : undefined;

  // Presentation component
  const presentationContent = (
    <PostCalendarPostView
      date={new Date(post.date)}
      status={status as 'posted' | 'scheduled' | 'draft'}
      channel={{
        name: post.channel.name ?? "",
        typeId: channelTypeId,
      }}
      schedule={
        virtual || post.schedule
          ? {
              name: virtual ? post.schedule?.name ?? "" : post.schedule?.name ?? "",
              emoji: virtual ? post.schedule?.emoji ?? undefined : post.schedule?.emoji ?? undefined,
              color: virtual ? post.schedule?.color ?? undefined : post.schedule?.color ?? undefined,
            }
          : undefined
      }
      caption={captionPreview}
      showCaption={preferences.view.showCaptions}
      mediaSlot={
        <PostCalendarPostMedia
          postMedia={virtual ? [] : post.postMedia}
          isVirtual={virtual}
        />
      }
      overlaySlot={overlay}
      actionSlot={skipButton}
      onMouseLeave={() => setConfirmSkip(false)}
      layoutId={virtual ? `virtual-post-${post.date}-${post.channelId}` : undefined}
    />
  );

  // Wrap with drag behavior and link for real posts
  const viewContent = !virtual ? (
    <Link to="/posts/$postId" params={{ postId: post.id }} className="block">
      <div
        draggable
        onDragStart={(e) => startPostDrag(e, post as Post)}
        onDragEnd={endPostDrag}
        className="cursor-grab active:cursor-grabbing"
      >
        {presentationContent}
      </div>
    </Link>
  ) : (
    <div ref={cardRef}>
      {presentationContent}
    </div>
  );

  return (
    <>
      <PostCalendarDropzone post={post} onUpdate={onUpdate}>
        {viewContent}
      </PostCalendarDropzone>
      
      {/* Simplified panel for virtual posts */}
      {isVirtualPost(post) && (
        <VirtualPostMediaPanel
          virtualPost={post}
          isOpen={simplifiedPanelOpen}
          onClose={() => {
            setSimplifiedPanelOpen(false);
            if (onUpdate) {
              onUpdate();
            }
          }}
          onExpand={() => {
            setSimplifiedPanelOpen(false);
            setCreatePostData({
              media: [],
              initialDate: new Date(post.date),
              initialChannelId: post.channelId,
              scheduleId: post.scheduleId ?? undefined,
              initialMediaSelectionExpanded: true,
              allPosts,
              virtualPost: post,
            });
          }}
          cardBounds={cardBounds}
        />
      )}
      
      {/* Full dialog for editing existing posts or when expanded */}
      <CreatePostDialog
        open={createPostData !== null}
        onOpenChange={closeCreatePostDialog}
        media={createPostData?.media ?? []}
        initialDate={createPostData?.initialDate}
        initialChannelId={createPostData?.initialChannelId}
        scheduleId={createPostData?.scheduleId}
        initialMediaSelectionExpanded={createPostData?.initialMediaSelectionExpanded}
        allPosts={createPostData?.allPosts}
        virtualPost={createPostData?.virtualPost}
        onNavigateToSlot={handleNavigateToSlot}
      />
    </>
  );
};
