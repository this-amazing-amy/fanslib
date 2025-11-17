import type { MediaSchema, PostStatusSchema } from "@fanslib/server/schemas";
import { parseDate } from "@internationalized/date";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ChannelSelect } from "~/components/ChannelSelect";
import { HashtagButton } from "~/components/HashtagButton";
import { SnippetSelector } from "~/components/SnippetSelector";
import { StatusSelect } from "~/components/StatusSelect";
import { SubredditSelect } from "~/components/SubredditSelect";
import { TimePicker } from "~/components/TimePicker";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { DatePicker } from "~/components/ui/DatePicker";
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
import { MediaSelection } from "~/features/library/components/MediaSelection";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useCreatePostMutation } from "~/lib/queries/posts";
import { useSubredditQuery } from "~/lib/queries/subreddits";

type Media = typeof MediaSchema.static;
type PostStatus = typeof PostStatusSchema.static;

type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
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
}: CreatePostDialogProps) => {
  const navigate = useNavigate();
  const { data: channels = [] } = useChannelsQuery();
  const { mutateAsync: createPost } = useCreatePostMutation();

  const [selectedChannel, setSelectedChannel] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      return new Date(initialDate);
    }
    const now = new Date();
    now.setHours(12);
    now.setMinutes(0);
    return now;
  });
  const [status, setStatus] = useState<PostStatus>("draft");
  const [selectedMedia, setSelectedMedia] = useState<Media[]>(media);
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [isMediaSelectionOpen, setIsMediaSelectionOpen] = useState(false);
  const [isOtherCaptionsOpen, setIsOtherCaptionsOpen] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: subreddit } = useSubredditQuery({ 
    id: selectedSubreddits[0] ?? "" 
  });

  const otherCaptions = useMemo<Array<{ caption?: string | null; channel?: { name?: string; typeId?: string } | null }>>(() => {
    const captions = selectedMedia.flatMap((mediaItem) => {
      // Media items don't have postMedia property - this is only on Post entities
      // Return empty array as media items don't have associated posts
      return [];
    });
    return [...new Set(captions)];
  }, [selectedMedia]);

  const selectedChannelData = (channels ?? []).find((c) => c.id === selectedChannel[0]);
  const isRedditChannel = selectedChannelData?.type.id === "reddit";
  const channelCaptionMaxLength = getCaptionMaxLength(selectedChannelData?.type.id);

  const disabled = channelCaptionMaxLength !== Infinity && caption?.length >= channelCaptionMaxLength;

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
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

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
      });

      toast();
      onOpenChange(false);

      if (shouldRedirect && newPost?.id) {
        navigate({ to: `/orchestrate` });
      }
    } catch (error) {
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
  ]);

  return (
    <MediaSelectionProvider media={selectedMedia}>
      <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
        <DialogModal>
          <Dialog maxWidth="3xl" className="max-h-[80vh] flex flex-col">
            {({ close }) => (
              <>
                <DialogHeader>
                  <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>

          <div className="flex flex-col overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 pl-1">
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <StatusSelect
                    value={[status]}
                    onChange={(statuses) => {
                      setStatus(statuses[0] as PostStatus);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Date</label>
                    <DatePicker
                      value={parseDate(selectedDate.toISOString().split('T')[0] ?? '')}
                      onChange={(dateValue) => {
                        if (dateValue) {
                          const { year, month, day } = dateValue as { year: number; month: number; day: number };
                          const newDate = new Date(selectedDate);
                          newDate.setFullYear(year, month - 1, day);
                          setSelectedDate(newDate);
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Time</label>
                    <TimePicker
                      date={selectedDate}
                      setDate={(hours, minutes) => {
                        const newDate = new Date(selectedDate);
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        setSelectedDate(newDate);
                      }}
                    />
                  </div>
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
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Selected Media ({selectedMedia.length})
                  </label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedMedia.map((item, index) => (
                        <div key={item.id} className="relative aspect-square">
                          <MediaTile media={item} allMedias={selectedMedia} index={index} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {otherCaptions.length > 0 && (
                  <div className="mt-2">
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
                          {otherCaptions.map((otherCaption, index) =>
                            !otherCaption?.caption ? null : (
                              <div
                                key={index}
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

            <div className="flex flex-col flex-1 min-h-0">
              <Button
                variant="ghost"
                className="flex items-center gap-2 self-start my-2"
                onPress={() => setIsMediaSelectionOpen(!isMediaSelectionOpen)}
              >
                {isMediaSelectionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {isMediaSelectionOpen ? "Hide Media Selection" : "Add more media"}
              </Button>

              {isMediaSelectionOpen && (
                <MediaSelection
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleMediaSelect}
                  excludeMediaIds={media.map((m) => m.id)}
                />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="redirect-checkbox"
              isSelected={shouldRedirect}
              onChange={(checked) => setShouldRedirect(checked)}
            >
              Redirect to post detail after creation
            </Checkbox>
          </div>

                <DialogFooter className="flex flex-col gap-2">
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
