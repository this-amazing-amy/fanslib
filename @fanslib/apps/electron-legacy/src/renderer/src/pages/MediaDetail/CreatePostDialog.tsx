import { ChannelBadge } from '@renderer/components/ChannelBadge';
import { ChannelSelect } from '@renderer/components/ChannelSelect';
import { HashtagButton } from '@renderer/components/HashtagButton';
import { MediaSelection } from '@renderer/components/MediaSelection';
import { MediaTile } from '@renderer/components/MediaTile';
import { SnippetSelector } from '@renderer/components/SnippetSelector';
import { StatusSelect } from '@renderer/components/StatusSelect';
import { SubredditSelect } from '@renderer/components/SubredditSelect';
import { TimePicker } from '@renderer/components/TimePicker';
import { Button } from '@renderer/components/ui/Button';
import { Checkbox } from '@renderer/components/ui/Checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@renderer/components/ui/Collapsible';
import { DatePicker } from '@renderer/components/ui/DatePicker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/Dialog';
import { ScrollArea } from '@renderer/components/ui/ScrollArea';
import { Textarea } from '@renderer/components/ui/Textarea';
import { useToast } from '@renderer/components/ui/Toast/use-toast';
import { MediaSelectionProvider } from '@renderer/contexts/MediaSelectionContext';
import {
  STORAGE_KEYS,
  useLocalStorageState,
} from '@renderer/lib/local-storage';
import { cn } from '@renderer/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MediaFilters } from 'src/features/library/api-type';
import { Media } from '../../../../features/library/entity';
import { PostStatus } from '../../../../features/posts/entity';
import { useChannels } from '../../hooks/api/useChannels';
import { captionMaxLength } from '../../lib/caption-max-length';
import { CreatePostAndPostponeButton } from './CreatePostAndPostponeButton';

type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
};

export const CreatePostDialog = ({
  open,
  onOpenChange,
  media,
  initialDate,
  initialChannelId,
  initialCaption,
}: CreatePostDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: channels = [] } = useChannels();
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
  const [status, setStatus] = useState<PostStatus>('draft');
  const [selectedMedia, setSelectedMedia] = useState<Media[]>(media);
  const [caption, setCaption] = useState(initialCaption || '');
  const [isMediaSelectionOpen, setIsMediaSelectionOpen] = useState(false);
  const [isOtherCaptionsOpen, setIsOtherCaptionsOpen] = useState(false);
  const [eligibleMediaFilter, setEligibleMediaFilter] = useState<
    MediaFilters | undefined
  >();
  const [shouldRedirect, setShouldRedirect] = useLocalStorageState(
    STORAGE_KEYS.REDIRECT_TO_POST_DETAIL,
    true
  );

  const otherCaptions = useMemo(() => {
    const captions = selectedMedia.flatMap((media) => {
      return media.postMedia?.map((pm) => ({
        caption: pm.post?.caption,
        channel: pm.post?.channel,
      }));
    });
    return [...new Set(captions)];
  }, [selectedMedia]);

  const selectedChannelData = channels.find((c) => c.id === selectedChannel[0]);
  const isRedditChannel = selectedChannelData?.type.id === 'reddit';
  const channelCaptionMaxLength = selectedChannelData
    ? captionMaxLength(selectedChannelData.type)
    : undefined;

  const disabled =
    channelCaptionMaxLength && caption?.length >= channelCaptionMaxLength;

  const selectedSubredditData = useMemo(async () => {
    if (!selectedSubreddits[0]) return null;
    return window.api['channel:subreddit-get'](selectedSubreddits[0]);
  }, [selectedSubreddits]);

  useEffect(() => {
    const loadEligibleMediaFilter = async () => {
      if (isRedditChannel && selectedSubreddits[0]) {
        const subreddit = await selectedSubredditData;
        setEligibleMediaFilter(subreddit?.eligibleMediaFilter);
      } else {
        setEligibleMediaFilter(selectedChannelData?.eligibleMediaFilter);
      }
    };

    loadEligibleMediaFilter();
  }, [
    isRedditChannel,
    selectedChannelData,
    selectedSubreddits,
    selectedSubredditData,
  ]);

  useEffect(() => {
    if (!open) return;
    setSelectedMedia(media);
  }, [open, media]);

  useEffect(() => {
    if (!open) return;
    setCaption(initialCaption);
  }, [open, initialCaption]);

  useEffect(() => {
    if (!open) return;
    if (initialChannelId) {
      setSelectedChannel([initialChannelId]);
    } else if (!channels.length || channels.length > 1) {
      setSelectedChannel([]);
    } else {
      setSelectedChannel([channels[0].id]);
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
        // Don't allow deselecting the initial media items
        if (media.some((m) => m.id === mediaItem.id)) return prev;
        return prev.filter((m) => m.id !== mediaItem.id);
      } else {
        return [...prev, mediaItem];
      }
    });
  };

  const handleCreatePost = useCallback(async () => {
    if (selectedChannel.length === 0) {
      toast({
        title: 'Please select a channel',
        variant: 'destructive',
      });
      return;
    }

    if (isRedditChannel && selectedSubreddits.length === 0) {
      toast({
        title: 'Please select a subreddit',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPost = await window.api['post:create'](
        {
          date: selectedDate.toISOString(),
          channelId: selectedChannel[0],
          status,
          caption,
          subredditId: isRedditChannel ? selectedSubreddits[0] : undefined,
        },
        selectedMedia.map((m) => m.id)
      );

      toast({
        title: 'Post created successfully',
      });

      onOpenChange(false);

      if (shouldRedirect) {
        navigate(`/posts/${newPost.id}`);
      } else {
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Failed to create post',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [
    selectedChannel,
    selectedDate,
    status,
    selectedMedia,
    onOpenChange,
    toast,
    caption,
    navigate,
    shouldRedirect,
    isRedditChannel,
    selectedSubreddits,
  ]);

  return (
    <MediaSelectionProvider media={selectedMedia}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>

          <div className='flex flex-col overflow-y-auto flex-1'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-4 pl-1'>
                <div className='flex flex-col space-y-2'>
                  <label className='text-sm font-medium'>Channel</label>
                  <ChannelSelect
                    value={selectedChannel}
                    onChange={setSelectedChannel}
                    multiple={false}
                  />
                </div>
                {isRedditChannel && (
                  <div className='flex flex-col space-y-2'>
                    <label className='text-sm font-medium'>Subreddit</label>
                    <SubredditSelect
                      value={selectedSubreddits}
                      onChange={setSelectedSubreddits}
                      multiple={false}
                    />
                  </div>
                )}
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium'>Status</label>
                  <StatusSelect
                    value={[status]}
                    onChange={(statuses) => {
                      setStatus(statuses[0] as PostStatus);
                    }}
                  />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium'>Date</label>
                    <DatePicker date={selectedDate} setDate={setSelectedDate} />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium'>Time</label>
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
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium'>Caption</label>
                  <div className='relative'>
                    <Textarea
                      maxLength={channelCaptionMaxLength}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder='Write your post caption...'
                      className='min-h-[150px] pr-10'
                    />
                    {channelCaptionMaxLength &&
                      channelCaptionMaxLength !== Infinity && (
                        <p
                          className={cn(
                            'text-xs text-muted-foreground absolute right-2 bottom-2',
                            caption?.length >= channelCaptionMaxLength &&
                              'text-destructive'
                          )}
                        >
                          {caption?.length} / {channelCaptionMaxLength}
                        </p>
                      )}
                    <div className='absolute right-2 top-2 flex gap-1'>
                      <SnippetSelector
                        channelId={selectedChannelData?.id}
                        caption={caption}
                        onCaptionChange={setCaption}
                        className='text-muted-foreground hover:text-foreground'
                      />
                      <HashtagButton
                        channel={selectedChannelData}
                        caption={caption}
                        onCaptionChange={setCaption}
                        className='text-muted-foreground hover:text-foreground'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium'>
                    Selected Media ({selectedMedia.length})
                  </label>
                  <ScrollArea className='h-[200px] border rounded-md p-2'>
                    <div className='grid grid-cols-3 gap-2'>
                      {selectedMedia.map((item, index) => (
                        <div key={item.id} className='relative aspect-square'>
                          <MediaTile
                            media={item}
                            allMedias={selectedMedia}
                            index={index}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {otherCaptions.length > 0 && (
                  <Collapsible
                    open={isOtherCaptionsOpen}
                    onOpenChange={setIsOtherCaptionsOpen}
                    className='mt-2'
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='flex w-full items-center justify-between p-2 text-sm font-medium'
                      >
                        Captions from other posts using this media
                        {isOtherCaptionsOpen ? (
                          <ChevronUp className='h-4 w-4' />
                        ) : (
                          <ChevronDown className='h-4 w-4' />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className='h-[200px] rounded-md border p-2'>
                        <div className='space-y-2'>
                          {otherCaptions.map((otherCaption, index) =>
                            !otherCaption?.caption ? null : (
                              <div
                                key={index}
                                className='group relative min-h-8 flex flex-col rounded-md border p-2'
                              >
                                <ChannelBadge
                                  className='self-start'
                                  name={otherCaption.channel?.name}
                                  typeId={otherCaption.channel?.typeId}
                                />
                                <p className='text-sm pt-2'>
                                  {otherCaption.caption}
                                </p>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='absolute right-2 top-1 opacity-0 group-hover:opacity-100'
                                  onClick={() =>
                                    setCaption(otherCaption.caption)
                                  }
                                >
                                  Use
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>

            <div className='flex flex-col flex-1 min-h-0'>
              <Button
                variant='ghost'
                className='flex items-center gap-2 self-start my-2'
                onClick={() => setIsMediaSelectionOpen(!isMediaSelectionOpen)}
              >
                {isMediaSelectionOpen ? (
                  <ChevronUp className='h-4 w-4' />
                ) : (
                  <ChevronDown className='h-4 w-4' />
                )}
                {isMediaSelectionOpen
                  ? 'Hide Media Selection'
                  : 'Add more media'}
              </Button>

              {isMediaSelectionOpen && (
                <MediaSelection
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleMediaSelect}
                  referenceMedia={media[0]}
                  excludeMediaIds={media.map((m) => m.id)}
                  eligibleMediaFilter={eligibleMediaFilter}
                />
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='redirect-checkbox'
              checked={shouldRedirect}
              onCheckedChange={(checked) =>
                setShouldRedirect(checked as boolean)
              }
            />
            <label
              htmlFor='redirect-checkbox'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Redirect to post detail after creation
            </label>
          </div>

          <DialogFooter className='flex flex-col gap-2'>
            <CreatePostAndPostponeButton
              selectedChannel={channels.find(
                (c) => c.id === selectedChannel[0]
              )}
              selectedDate={selectedDate}
              caption={caption}
              selectedMedia={selectedMedia}
              onOpenChange={onOpenChange}
              shouldRedirect={shouldRedirect}
              disabled={disabled}
            />
            <Button
              onClick={handleCreatePost}
              className='w-full'
              disabled={disabled}
            >
              Create post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MediaSelectionProvider>
  );
};
