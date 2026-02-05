import type { Media, PostStatus, PostWithRelations } from '@fanslib/server/schemas';
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ChannelSelect } from "~/components/ChannelSelect";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { ContentScheduleSelect } from "~/components/ContentScheduleSelect";
import { DateTimePicker } from "~/components/DateTimePicker";
import { HashtagButton } from "~/components/HashtagButton";
import { SnippetSelector } from "~/components/SnippetSelector";
import { StatusSelect } from "~/components/StatusSelect";
import { SubredditSelect } from "~/components/SubredditSelect";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { Textarea } from "~/components/ui/Textarea";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { CombinedMediaSelection } from "~/features/library/components/CombinedMediaSelection";
import { RecentPostsPanel } from "~/features/posts/components/RecentPostsPanel";
import { usePrefersReducedMotion } from "~/hooks/usePrefersReducedMotion";
import { cn } from "~/lib/cn";
import { findNextUnfilledSlot } from "~/lib/find-next-unfilled-slot";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentScheduleQuery, useSkipScheduleSlotMutation } from "~/lib/queries/content-schedules";
import { useCreatePostMutation } from "~/lib/queries/posts";
import type { VirtualPost } from "~/lib/virtual-posts";



type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
  initialStatus?: PostStatus;
  initialSubredditId?: string;
  scheduleId?: string;
  title?: string;
  initialMediaSelectionExpanded?: boolean;
  initialShouldRedirect?: boolean;
  allPosts?: (PostWithRelations | VirtualPost)[];
  virtualPost?: VirtualPost;
  onNavigateToSlot?: (post: VirtualPost) => void;
};

const toast = () => {};

const CAPTION_MAX_LENGTH: Record<string, number> = {
  reddit: 40000,
  clips4sale: Infinity,
};

const getCaptionMaxLength = (channelTypeId?: string): number => {
  if (!channelTypeId) return Infinity;
  return CAPTION_MAX_LENGTH[channelTypeId] ?? Infinity;
};

export const CreatePostDialog = ({
  open,
  onOpenChange,
  media,
  initialDate,
  initialChannelId,
  initialCaption,
  initialStatus,
  initialSubredditId,
  scheduleId,
  title = "Create Post",
  initialMediaSelectionExpanded: _initialMediaSelectionExpanded,
  initialShouldRedirect = true,
  allPosts = [],
  virtualPost,
  onNavigateToSlot,
}: CreatePostDialogProps) => {
  const navigate = useNavigate();
  const { data: channels = [] } = useChannelsQuery();
  const { mutateAsync: createPost } = useCreatePostMutation();
  const skipSlotMutation = useSkipScheduleSlotMutation();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showContent, setShowContent] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(initialSubredditId ? [initialSubredditId] : []);
  const [contentScheduleId, setContentScheduleId] = useState<string | null>(scheduleId ?? null);
  
  const { data: contentSchedule } = useContentScheduleQuery(contentScheduleId ?? "");
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      return new Date(initialDate);
    }
    const defaultDate = new Date();
    defaultDate.setHours(12);
    defaultDate.setMinutes(0);
    defaultDate.setSeconds(0);
    defaultDate.setMilliseconds(0);
    return defaultDate;
  });
  const [status, setStatus] = useState<PostStatus>(initialStatus ?? "draft");
  const [selectedMedia, setSelectedMedia] = useState<Media[]>(media);
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [isOtherCaptionsOpen, setIsOtherCaptionsOpen] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(initialShouldRedirect);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const otherCaptions = useMemo<Array<{ caption?: string | null; channel?: { id?: string; name?: string; typeId?: string } | null }>>(() => {
    const captions = selectedMedia.flatMap(() => []);
    return [...new Set(captions)];
  }, [selectedMedia]);

  const selectedChannelData = (channels ?? []).find((c) => c.id === selectedChannel[0]);
  const isRedditChannel = selectedChannelData?.type.id === "reddit";
  const channelCaptionMaxLength = getCaptionMaxLength(selectedChannelData?.type.id);

  const minDateTime = useMemo(() => new Date(), []);

  const disabled = 
    selectedChannel.length === 0 || 
    selectedMedia.length === 0 ||
    (channelCaptionMaxLength !== Infinity && caption?.length >= channelCaptionMaxLength);

  useEffect(() => {
    if (!open) return;
    setSelectedMedia(media);
  }, [open, media]);

  useEffect(() => {
    if (!open) return;
    setCaption(initialCaption ?? "");
  }, [open, initialCaption]);

  useEffect(() => {
    if (!open) return;
    if (initialChannelId) {
      setSelectedChannel([initialChannelId]);
    } else if (!channels?.length || channels.length > 1) {
      setSelectedChannel([]);
    } else {
      setSelectedChannel([channels[0]?.id ?? ""]);
    }
  }, [channels, initialChannelId, open]);

  useEffect(() => {
    if (!open) return;
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
    } else {
      const defaultDate = new Date();
      defaultDate.setHours(12);
      defaultDate.setMinutes(0);
      defaultDate.setSeconds(0);
      defaultDate.setMilliseconds(0);
      setSelectedDate(defaultDate);
    }
  }, [open, initialDate]);

  useEffect(() => {
    if (!open) return;
    setContentScheduleId(scheduleId ?? null);
  }, [open, scheduleId]);

  useEffect(() => {
    if (!open) return;
    setSelectedSubreddits(initialSubredditId ? [initialSubredditId] : []);
  }, [open, initialSubredditId]);

  useEffect(() => {
    if (!open) return;
    setStatus(initialStatus ?? "draft");
  }, [open, initialStatus]);

  useEffect(() => {
    if (!open) return;
    setShouldRedirect(initialShouldRedirect);
  }, [open, initialShouldRedirect]);

  useEffect(() => {
    if (!isRedditChannel) {
      setSelectedSubreddits([]);
    }
  }, [isRedditChannel]);

  const handleMediaSelect = (mediaItem: Media) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === mediaItem.id);
      if (isSelected) {
        if (media.some((m) => m.id === mediaItem.id)) return prev;
        return prev.filter((m) => m.id !== mediaItem.id);
      }
      return [...prev, mediaItem];
    });
  };

  const handleCreatePost = useCallback(async (shouldNavigateToNext = false) => {
    if (selectedChannel.length === 0) {
      toast();
      return;
    }

    if (isRedditChannel && selectedSubreddits.length === 0) {
      toast();
      return;
    }

    try {
      if (!selectedChannel[0]) {
        toast();
        return;
      }
      const newPost = await createPost({
        date: selectedDate,
        channelId: selectedChannel[0],
        status,
        caption: caption || null,
        subredditId: isRedditChannel ? selectedSubreddits[0] : undefined,
        mediaIds: selectedMedia.map((m) => m.id),
        scheduleId: contentScheduleId ?? undefined,
      });

      toast();
      
      // Handle navigation to next slot
      if (shouldNavigateToNext && virtualPost && onNavigateToSlot) {
        const nextSlot = findNextUnfilledSlot({
          currentPost: virtualPost,
          allPosts,
        });
        
        if (nextSlot) {
          // Clear selection for next slot
          setSelectedMedia([]);
          setCaption("");
          // Navigate to next slot
          onNavigateToSlot(nextSlot);
        } else {
          // No more unfilled slots, close dialog
          onOpenChange(false);
        }
      } else {
        onOpenChange(false);
      }

      if (shouldRedirect && newPost?.id && !shouldNavigateToNext) {
        navigate({ to: `/posts/${newPost.id}` });
      }
    } catch {
      toast();
    }
  }, [
    selectedChannel,
    selectedDate,
    status,
    selectedMedia,
    onOpenChange,
    caption,
    navigate,
    shouldRedirect,
    isRedditChannel,
    selectedSubreddits,
    createPost,
    contentScheduleId,
    virtualPost,
    onNavigateToSlot,
    allPosts,
  ]);

  const handleNavigateToNextSlot = useCallback(() => {
    if (!virtualPost || !onNavigateToSlot) return;

    const nextSlot = findNextUnfilledSlot({
      currentPost: virtualPost,
      allPosts,
    });

    if (nextSlot) {
      // Clear selection for next slot
      setSelectedMedia([]);
      setCaption("");
      // Navigate to next slot
      onNavigateToSlot(nextSlot);
    } else {
      // Show message if no unfilled slots remain
      toast();
    }
  }, [virtualPost, onNavigateToSlot, allPosts]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isEnter = event.key === 'Enter';
      const isTab = event.key === 'Tab';
      const isEscape = event.key === 'Escape';
      
      // Escape: Close dialog
      if (isEscape) {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      
      // Shift+Enter: Create and Next
      if (isShift && isEnter && !disabled) {
        event.preventDefault();
        handleCreatePost(true);
        return;
      }
      
      // Cmd/Ctrl+Enter: Create Post
      if (isCmdOrCtrl && isEnter && !disabled) {
        event.preventDefault();
        handleCreatePost(false);
        return;
      }
      
      // Tab: Navigate to next slot without creating
      if (isTab && virtualPost && onNavigateToSlot) {
        event.preventDefault();
        handleNavigateToNextSlot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, disabled, handleCreatePost, virtualPost, onNavigateToSlot, handleNavigateToNextSlot, onOpenChange]);

  useEffect(() => {
    if (open) {
      if (prefersReducedMotion) {
        setShowContent(true);
      } else {
        const timer = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(timer);
      }
    } else {
      setShowContent(false);
    }
  }, [open, prefersReducedMotion]);

  const handleSkipSlot = useCallback(async () => {
    if (!scheduleId || !selectedChannel[0]) return;

    if (!confirmSkip) {
      setConfirmSkip(true);
      return;
    }

    try {
      await skipSlotMutation.mutateAsync({
        scheduleId,
        date: selectedDate,
      });
      
      setConfirmSkip(false);
      onOpenChange?.(false);
    } catch {
      toast();
      setConfirmSkip(false);
    }
  }, [scheduleId, selectedChannel, selectedDate, confirmSkip, skipSlotMutation, onOpenChange]);

  const layoutId = virtualPost ? `virtual-post-${virtualPost.date}-${virtualPost.channelId}` : undefined;
  const transitionDuration = prefersReducedMotion ? 0 : 0.3;

  return (
    <MediaSelectionProvider media={selectedMedia}>
      <AnimatePresence mode="wait">
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: transitionDuration }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 z-[70] bg-black/50"
            />
            
            {/* Panel */}
            <motion.div
              layoutId={layoutId}
              className={cn(
                "fixed left-[50%] top-[50%] z-[71] w-full max-w-[30rem]",
                "translate-x-[-50%] translate-y-[-50%]",
                "border-2 border-base-content bg-base-100 shadow-xl rounded-xl",
                "max-h-[90vh] flex flex-col overflow-hidden p-6"
              )}
              transition={{
                duration: transitionDuration,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="xs"
                aria-label="Close"
                className="btn-circle absolute right-2 top-2 z-10"
                onPress={() => onOpenChange(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Content with fade-in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2, delay: prefersReducedMotion ? 0 : 0.15 }}
                className="flex flex-col h-full"
              >
                <div className="flex-shrink-0 mb-2">
                  {virtualPost ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <h2 className="font-bold text-lg">
                            {format(new Date(virtualPost.date), "EEEE, MMMM d")}
                          </h2>
                          <div className="text-sm text-base-content/60 font-medium">
                            {format(new Date(virtualPost.date), "h:mm a")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChannelBadge
                          name={virtualPost.channel.name}
                          typeId={virtualPost.channel.type?.id ?? virtualPost.channel.typeId}
                          size="sm"
                          borderStyle="visible"
                        />
                        {virtualPost.schedule && (
                          <ContentScheduleBadge
                            name={virtualPost.schedule.name}
                            emoji={virtualPost.schedule.emoji ?? undefined}
                            color={virtualPost.schedule.color ?? undefined}
                            size="sm"
                            borderStyle="visible"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <h2 className="font-bold text-lg">{title}</h2>
                  )}
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="flex flex-col gap-4 pr-2">
                    {/* Top Section: Combined Media Selection */}
                    <div className="flex-shrink-0">
                      <CombinedMediaSelection
                        selectedMedia={selectedMedia}
                        onMediaSelect={handleMediaSelect}
                        excludeMediaIds={media.map((m) => m.id)}
                        scheduleId={contentScheduleId ?? undefined}
                        channelId={selectedChannel[0]}
                        autoApplyFilters={true}
                        onClose={() => onOpenChange(false)}
                      />
                    </div>

                    {/* Recent Posts Context */}
                    {selectedChannel[0] ? (
                      <div className="flex-shrink-0">
                        <RecentPostsPanel 
                          channelId={selectedChannel[0]} 
                          limit={3} 
                          defaultCollapsed={false}
                        />
                      </div>
                    ) : null}

                    {/* Bottom Section: Post Details */}
                    <div className="flex flex-col gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Channel</label>
                    <ChannelSelect
                      value={selectedChannel}
                      onChange={setSelectedChannel}
                      multiple={false}
                    />
                  </div>
                  {isRedditChannel && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">Subreddit</label>
                      <SubredditSelect
                        value={selectedSubreddits}
                        onChange={setSelectedSubreddits}
                        multiple={false}
                      />
                    </div>
                  )}
                  {selectedChannel[0] && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">Content Schedule</label>
                      <ContentScheduleSelect
                        value={contentScheduleId}
                        onChange={setContentScheduleId}
                        channelId={selectedChannel[0]}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <StatusSelect
                      value={[status]}
                      onChange={(statuses) => {
                        setStatus(statuses[0] as PostStatus);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Date & Time</label>
                    <DateTimePicker 
                      date={selectedDate} 
                      setDate={setSelectedDate}
                      minValue={minDateTime}
                      preferredTimes={contentSchedule && 'preferredTimes' in contentSchedule ? contentSchedule.preferredTimes ?? [] : []}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Caption</label>
                    <div className="relative">
                      <Textarea
                        maxLength={channelCaptionMaxLength !== Infinity ? channelCaptionMaxLength : undefined}
                        value={caption ?? ""}
                        onChange={(value) => setCaption(value)}
                        placeholder="Write your post caption..."
                        className="min-h-[150px] pr-10"
                      />
                      {channelCaptionMaxLength !== Infinity && (
                        <p
                          className={cn(
                            "text-xs text-base-content/60 absolute right-2 bottom-2",
                            caption?.length >= channelCaptionMaxLength && "text-error"
                          )}
                        >
                          {caption?.length} / {channelCaptionMaxLength}
                        </p>
                      )}
                      <div className="absolute right-2 top-2 flex gap-1">
                        <SnippetSelector
                          channelId={selectedChannelData?.id}
                          caption={caption}
                          onCaptionChange={setCaption}
                          textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                          className="text-base-content/60 hover:text-base-content"
                        />
                        {selectedChannelData && (
                          <HashtagButton
                            channel={selectedChannelData}
                            caption={caption}
                            onCaptionChange={setCaption}
                            className="text-base-content/60 hover:text-base-content"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {otherCaptions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex w-full items-center justify-between p-2 text-sm font-medium"
                        onPress={() => setIsOtherCaptionsOpen(!isOtherCaptionsOpen)}
                      >
                        Captions from other posts using this media
                        {isOtherCaptionsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {isOtherCaptionsOpen && (
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                          <div className="space-y-2">
                            {otherCaptions.map((otherCaption) =>
                              !otherCaption?.caption ? null : (
                                <div
                                  key={otherCaption.channel?.id ?? otherCaption.caption}
                                  className="group relative min-h-8 flex flex-col rounded-md border p-2"
                                >
                                  <ChannelBadge
                                    className="self-start"
                                    name={otherCaption.channel?.name ?? ""}
                                    typeId={otherCaption.channel?.typeId ?? ""}
                                  />
                                  <p className="text-sm pt-2">{otherCaption.caption}</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-2 top-1 opacity-0 group-hover:opacity-100"
                                    onPress={() => setCaption(otherCaption.caption ?? "")}
                                  >
                                    Use
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex items-center space-x-2 flex-shrink-0 mt-2">
                  <Checkbox
                    id="redirect-checkbox"
                    isSelected={shouldRedirect}
                    onChange={(checked) => setShouldRedirect(checked)}
                  >
                    Redirect to post detail after creation
                  </Checkbox>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
                  <div className="flex gap-2 w-full">
                    {scheduleId && selectedMedia.length === 0 && (
                      <Button
                        variant="ghost"
                        onPress={handleSkipSlot}
                        className="flex-1"
                        onMouseLeave={() => setConfirmSkip(false)}
                      >
                        {confirmSkip ? "Click again to confirm skip" : "Skip This Slot"}
                      </Button>
                    )}
                    {virtualPost && onNavigateToSlot ? (
                      <>
                        <Button
                          onPress={() => {
                            handleCreatePost(false);
                            onOpenChange(false);
                          }}
                          className="flex-1"
                          isDisabled={disabled}
                        >
                          Create Post
                        </Button>
                        <Button
                          onPress={() => {
                            handleCreatePost(true);
                          }}
                          className="flex-1"
                          isDisabled={disabled}
                        >
                          Create & Next
                        </Button>
                      </>
                    ) : (
                      <Button
                        onPress={() => {
                          handleCreatePost(false);
                          onOpenChange(false);
                        }}
                        className={cn(
                          scheduleId && selectedMedia.length === 0 ? "flex-1" : "w-full"
                        )}
                        isDisabled={disabled}
                      >
                        Create post
                      </Button>
                    )}
                  </div>
                  {virtualPost && (
                    <Link 
                      to="/content/library" 
                      className="text-sm text-center text-base-content/60 hover:text-base-content underline"
                      onClick={() => onOpenChange(false)}
                    >
                      Browse Full Library
                    </Link>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MediaSelectionProvider>
  );
};
