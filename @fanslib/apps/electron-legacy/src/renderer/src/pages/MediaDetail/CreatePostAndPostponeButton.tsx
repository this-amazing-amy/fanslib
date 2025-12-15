import { Button } from '@renderer/components/ui/Button';
import { useToast } from '@renderer/components/ui/Toast/use-toast';
import { useSettings } from '@renderer/contexts/SettingsContext';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CHANNEL_TYPES } from '../../../../features/channels/channelTypes';
import { Channel } from '../../../../features/channels/entity';
import { Media } from '../../../../features/library/entity';

type CreatePostAndPostponeButtonProps = {
  selectedChannel: Channel | undefined;
  selectedDate: Date;
  caption: string;
  selectedMedia: Media[];
  onOpenChange: (open: boolean) => void;
  shouldRedirect?: boolean;
  disabled?: boolean;
};

export const CreatePostAndPostponeButton = ({
  selectedChannel,
  selectedDate,
  caption,
  selectedMedia,
  onOpenChange,
  shouldRedirect = true,
  disabled,
}: CreatePostAndPostponeButtonProps) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const navigate = useNavigate();

  if (
    !selectedChannel ||
    selectedChannel.typeId !== CHANNEL_TYPES.bluesky.id ||
    !settings?.postponeToken ||
    !settings?.blueskyUsername
  ) {
    return null;
  }

  const createPostAndSendToPostpone = async () => {
    try {
      // First create the post
      const post = await window.api['post:create'](
        {
          date: selectedDate.toISOString(),
          channelId: selectedChannel.id,
          status: 'draft',
          caption,
        },
        selectedMedia.map((m) => m.id)
      );

      // Then send it to Postpone
      await window.api['api-postpone:draftBlueskyPost']({ postId: post.id });

      toast({
        title: 'Post created and sent to Postpone',
        description: 'The draft has been created in your Postpone account.',
      });

      onOpenChange(false);

      if (shouldRedirect) {
        navigate(`/posts/${post.id}`);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create post and send to Postpone:', error);
      toast({
        title: 'Failed to create post',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={createPostAndSendToPostpone}
      className='w-full'
      variant='secondary'
      disabled={disabled}
    >
      <Send className='mr-2 h-4 w-4' />
      Create post and send to Postpone
    </Button>
  );
};
