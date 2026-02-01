import type { PostWithRelations } from '@fanslib/server/schemas';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import { ChannelBadge } from '~/components/ChannelBadge';
import { Button } from '~/components/ui/Button';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { PostDetailCaptionInput } from '~/features/posts/components/post-detail/PostDetailCaptionInput';
import { PostDetailDateTimeInputs } from '~/features/posts/components/post-detail/PostDetailDateTimeInputs';
import { PostDetailAnalytics } from '~/features/posts/components/post-detail/PostDetailAnalytics';
import { PostDetailMedia } from '~/features/posts/components/post-detail/PostDetailMedia';
import { PostDetailNavigation } from '~/features/posts/components/post-detail/PostDetailNavigation';
import { PostDetailPostponeButton } from '~/features/posts/components/post-detail/PostDetailPostponeButton';
import { PostDetailScheduleSelect } from '~/features/posts/components/post-detail/PostDetailScheduleSelect';
import { PostDetailStatusButtons } from '~/features/posts/components/post-detail/PostDetailStatusButtons';
import { PostDetailTemporalContext } from '~/features/posts/components/post-detail/PostDetailTemporalContext';
import { PostDetailUrlInput } from '~/features/posts/components/post-detail/PostDetailUrlInput';
import { usePostQuery } from '~/lib/queries/posts';

type Post = PostWithRelations;

const PostDetailRoute = () => {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePostQuery({ id: postId });

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      navigate({ to: '/plan' });
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate({ to: '/plan' });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !post || 'error' in post) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-semibold">Post not found</h1>
        <Button variant="ghost" onClick={goBack}>Back</Button>
      </div>
    );
  }

  const normalizedPost = post as unknown as Post;

  return (
    <MediaDragProvider>
      <div>
        <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1" />
            <PostDetailNavigation post={normalizedPost} />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Post</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
            <div className="@container flex flex-col gap-4">
                <ChannelBadge
                  name={normalizedPost.channel.typeId === 'reddit' && normalizedPost.subreddit?.name ? `r/${normalizedPost.subreddit.name}` : normalizedPost.channel.name}
                  typeId={normalizedPost.channel.typeId}
                size="md"
              />
              <PostDetailMedia post={normalizedPost} />
              <PostDetailPostponeButton post={normalizedPost} />
            </div>
            <div className="@container flex flex-col gap-4">
              <PostDetailStatusButtons post={normalizedPost} />
              <PostDetailScheduleSelect post={normalizedPost} />
              <PostDetailDateTimeInputs post={normalizedPost} />
              <PostDetailUrlInput post={normalizedPost} />
              <PostDetailCaptionInput post={normalizedPost} />
            </div>
          </div>

          <PostDetailTemporalContext post={normalizedPost} />
          <PostDetailAnalytics post={normalizedPost} />
        </div>
      </div>
    </MediaDragProvider>
  );
};

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailRoute,
});


