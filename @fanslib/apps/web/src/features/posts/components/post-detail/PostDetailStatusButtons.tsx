import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { CalendarDays, Check, Info, Undo2 } from 'lucide-react';
import { StatusSticker } from '~/components/StatusSticker';
import { Button } from '~/components/ui/Button';
import { Tooltip, TooltipTrigger } from '~/components/ui/Tooltip';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailStatusButtonsProps = {
  post: Post;
};

const InfoTooltip = () => (
  <TooltipTrigger>
    <Button variant="ghost" size="icon">
      <Info className="size-4" />
    </Button>
    <Tooltip className="max-w-[300px]">
      <p>
        FansLib helps you organize your posts but cannot automatically post them. You&apos;ll need
        to manually post/schedule content on each platform as they don&apos;t support external
        posting. After doing so, you can mark your post as scheduled or posted here.
      </p>
    </Tooltip>
  </TooltipTrigger>
);

export const PostDetailStatusButtons = ({ post }: PostDetailStatusButtonsProps) => {
  const updatePostMutation = useUpdatePostMutation();

  const handleUpdateStatus = async (status: 'draft' | 'scheduled' | 'posted') => {
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
          <StatusSticker status={post.status} className="justify-self-start" />
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus('scheduled')}
            isDisabled={isUpdating}
            className="btn-info"
          >
            <CalendarDays className="size-4 mr-2" />
            Mark scheduled
          </Button>
          <Button
            variant="success"
            onClick={() => handleUpdateStatus('posted')}
            isDisabled={isUpdating}
          >
            <Check className="size-4 mr-2" />
            Mark posted
          </Button>
          <InfoTooltip />
        </>
      );
    }

    if (post.status === 'scheduled') {
      return (
        <>
          <StatusSticker status={post.status} className="justify-self-start" />
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus('draft')}
            isDisabled={isUpdating}
          >
            <Undo2 className="size-4 mr-2" />
            Back to Draft
          </Button>
          <Button
            variant="success"
            onClick={() => handleUpdateStatus('posted')}
            isDisabled={isUpdating}
          >
            <Check className="size-4 mr-2" />
            Mark posted
          </Button>
          <InfoTooltip />
        </>
      );
    }

    if (post.status === 'posted') {
      return (
        <>
          <StatusSticker status={post.status} className="justify-self-start" />
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus('draft')}
            isDisabled={isUpdating}
          >
            <Undo2 className="size-4 mr-2" />
            Back to Draft
          </Button>
          <InfoTooltip />
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

