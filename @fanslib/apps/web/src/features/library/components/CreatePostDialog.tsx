import type { MediaSchema, PostStatusSchema } from "@fanslib/server/schemas";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ChannelSelect } from "~/components/ChannelSelect";
import { ContentScheduleSelect } from "~/components/ContentScheduleSelect";
import { DateTimePicker } from "~/components/DateTimePicker";
import { HashtagButton } from "~/components/HashtagButton";
import { SnippetSelector } from "~/components/SnippetSelector";
import { StatusSelect } from "~/components/StatusSelect";
import { SubredditSelect } from "~/components/SubredditSelect";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { Textarea } from "~/components/ui/Textarea";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { CombinedMediaSelection } from "~/features/library/components/CombinedMediaSelection";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentScheduleQuery } from "~/lib/queries/content-schedules";
import { useCreatePostMutation } from "~/lib/queries/posts";

type Media = typeof MediaSchema.static;
type PostStatus = typeof PostStatusSchema.static;

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
  initialMediaSelectionExpanded,
}: CreatePostDialogProps) => {
  const navigate = useNavigate();
  const { data: channels = [] } = useChannelsQuery();
  const { mutateAsync: createPost } = useCreatePostMutation();

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
  const [shouldRedirect, setShouldRedirect] = useState(true);

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

  const handleCreatePost = useCallback(async () => {
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
        date: selectedDate.toISOString(),
        channelId: selectedChannel[0],
        status,
        caption: caption || null,
        subredditId: isRedditChannel ? selectedSubreddits[0] : undefined,
        mediaIds: selectedMedia.map((m) => m.id),
        scheduleId: contentScheduleId ?? undefined,
      });

      toast();
      onOpenChange(false);

      if (shouldRedirect && newPost?.id) {
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
  ]);

  return (
    <MediaSelectionProvider media={selectedMedia}>
      <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
        <DialogModal>
          <Dialog maxWidth="3xl" className="max-h-[90vh] flex flex-col overflow-hidden">
            {({ close }) => (
              <>
                <DialogHeader className="flex-shrink-0 mb-2">
                  <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="flex flex-col gap-4 pr-2">
                    {/* Top Section: Combined Media Selection */}
                    <div className="flex-shrink-0">
                      <CombinedMediaSelection
                        selectedMedia={selectedMedia}
                        onMediaSelect={handleMediaSelect}
                        excludeMediaIds={media.map((m) => m.id)}
                      />
                    </div>

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
                      preferredTimes={contentSchedule?.preferredTimes ?? []}
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

                <DialogFooter className="flex flex-col gap-2 flex-shrink-0 mt-2">
                  <Button
                    onPress={() => {
                      handleCreatePost();
                      close();
                    }}
                    className="w-full"
                    isDisabled={disabled}
                  >
                    Create post
                  </Button>
                </DialogFooter>
              </>
            )}
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    </MediaSelectionProvider>
  );
};
