import type { PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { AlertTriangle, CalendarDays, Check, Undo2, Zap } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '~/components/StatusBadge';
import { Alert } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { getPostStatusStyles } from '~/lib/colors';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = PostWithRelations;

type PostDetailStatusButtonsProps = {
  post: Post;
};

export const PostDetailStatusButtons = ({ post }: PostDetailStatusButtonsProps) => {
  const updatePostMutation = useUpdatePostMutation();
  const [error, setError] = useState<string | null>(null);

  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      const obj = error as Record<string, unknown>;
      if (typeof obj.error === 'string') return obj.error;
      if (typeof obj.message === 'string') return obj.message;
      if (obj.value && typeof obj.value === 'object') {
        const value = obj.value as Record<string, unknown>;
        if (typeof value.error === 'string') return value.error;
        if (typeof value.message === 'string') return value.message;
      }
    }
    return 'An unknown error occurred';
  };

  const handleUpdateStatus = async (status: 'draft' | 'ready' | 'scheduled' | 'posted') => {
    setError(null);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          status,
        },
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      console.error(`Failed to update post status to ${status}:`, err);
    }
  };

  const handleResetRetries = async () => {
    setError(null);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          blueskyRetryCount: 0,
          blueskyPostError: null,
        },
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      console.error('Failed to reset retries:', err);
    }
  };

  const renderButtons = () => {
    const isUpdating = updatePostMutation.isPending;

    if (post.status === 'draft') {
      return (
        <>
          <StatusBadge status={post.status} size="md" className="justify-self-start" />
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
          <StatusBadge status={post.status} size="md" className="justify-self-start" />
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
          <StatusBadge status={post.status} size="md" className="justify-self-start" />
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
          <StatusBadge status={post.status} size="md" className="justify-self-start" />
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
    <div className="@container flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
        {renderButtons()}
      </div>
      {post.blueskyPostError && post.status === 'scheduled' && (
        <Alert variant={post.blueskyRetryCount >= 3 ? 'error' : 'warning'} title="Posting failed">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-medium">The scheduled post failed to publish to Bluesky:</p>
              <p className="mt-1 text-xs opacity-80 break-all">{post.blueskyPostError}</p>
              {post.blueskyRetryCount >= 3 ? (
                <p className="mt-2 text-xs">Maximum retries reached. Fix the issue and click &quot;Reset &amp; Retry&quot; to try again.</p>
              ) : (
                <p className="mt-2 text-xs">The system will retry automatically ({post.blueskyRetryCount}/3 attempts). You can also manually mark as posted or move back to draft.</p>
              )}
              {post.blueskyRetryCount >= 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetRetries()}
                  isDisabled={updatePostMutation.isPending}
                  className="mt-3 text-xs"
                >
                  Reset & Retry
                </Button>
              )}
            </div>
          </div>
        </Alert>
      )}
      {error && (
        <Alert variant="error" title="Failed to update status">
          {error}
        </Alert>
      )}
    </div>
  );
};

