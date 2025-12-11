import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { CalendarDays, Check, Undo2, Zap } from 'lucide-react';
import { StatusSticker } from '~/components/StatusSticker';
import { Button } from '~/components/ui/Button';
import { getPostStatusStyles } from '~/lib/colors';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailStatusButtonsProps = {
  post: Post;
};

export const PostDetailStatusButtons = ({ post }: PostDetailStatusButtonsProps) => {
  const updatePostMutation = useUpdatePostMutation();

  const handleUpdateStatus = async (status: 'draft' | 'ready' | 'scheduled' | 'posted') => {
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          status,
        },
      });
    } catch (err) {
      console.error(`Failed to update post status to ${status}:`, err);
    }
  };

  const renderButtons = () => {
    const isUpdating = updatePostMutation.isPending;

    if (post.status === 'draft') {
      return (
        <>
          <StatusSticker status={post.status} size="md" className="justify-self-start" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('ready')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('ready')}
            className="text-xs"
          >
            <Zap className="size-4 mr-2" />
            Mark Ready
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('scheduled')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('scheduled')}
            className="text-xs"
          >
            <CalendarDays className="size-4 mr-2" />
            Mark Scheduled
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('posted')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('posted')}
            className="text-xs"
          >
            <Check className="size-4 mr-2" />
            Mark Posted
          </Button>
        </>
      );
    }

    if (post.status === 'ready') {
      return (
        <>
          <StatusSticker status={post.status} size="md" className="justify-self-start" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('draft')}
            isDisabled={isUpdating}
            className="text-xs"
          >
            <Undo2 className="size-4 mr-2" />
            Back to Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('scheduled')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('scheduled')}
            className="text-xs"
          >
            <CalendarDays className="size-4 mr-2" />
            Mark Scheduled
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('posted')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('posted')}
            className="text-xs"
          >
            <Check className="size-4 mr-2" />
            Mark Posted
          </Button>
        </>
      );
    }

    if (post.status === 'scheduled') {
      return (
        <>
          <StatusSticker status={post.status} size="md" className="justify-self-start" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('draft')}
            isDisabled={isUpdating}
            className="text-xs"
          >
            <Undo2 className="size-4 mr-2" />
            Back to Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('posted')}
            isDisabled={isUpdating}
            style={getPostStatusStyles('posted')}
            className="text-xs"
          >
            <Check className="size-4 mr-2" />
            Mark Posted
          </Button>
        </>
      );
    }

    if (post.status === 'posted') {
      return (
        <>
          <StatusSticker status={post.status} size="md" className="justify-self-start" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus('draft')}
            isDisabled={isUpdating}
            className="text-xs"
          >
            <Undo2 className="size-4 mr-2" />
            Back to Draft
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
      {renderButtons()}
    </div>
  );
};

