import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import { ChannelBadge } from '~/components/ChannelBadge';
import { ContentScheduleBadge } from '~/components/ContentScheduleBadge';
import { Button } from '~/components/ui/Button';
import { MediaDragProvider } from '~/contexts/MediaDragContext';
import { PostDetailCaptionInput } from '~/features/posts/components/post-detail/PostDetailCaptionInput';
import { PostDetailDateTimeInputs } from '~/features/posts/components/post-detail/PostDetailDateTimeInputs';
import { PostDetailFanslyStatistics } from '~/features/posts/components/post-detail/PostDetailFanslyStatistics';
import { PostDetailMedia } from '~/features/posts/components/post-detail/PostDetailMedia';
import { PostDetailNavigation } from '~/features/posts/components/post-detail/PostDetailNavigation';
import { PostDetailPostponeButton } from '~/features/posts/components/post-detail/PostDetailPostponeButton';
import { PostDetailStatusButtons } from '~/features/posts/components/post-detail/PostDetailStatusButtons';
import { PostDetailScheduleSelect } from '~/features/posts/components/post-detail/PostDetailScheduleSelect';
import { PostDetailUrlInput } from '~/features/posts/components/post-detail/PostDetailUrlInput';
import { usePostQuery } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

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

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-semibold">Post not found</h1>
        <Button onClick={goBack}>Back</Button>
      </div>
    );
  }

  const normalizedPost: Post = {
    ...post,
    subreddit: post.subreddit ?? null,
  } as Post;

  return (
    <MediaDragProvider>
      <div className="overflow-y-auto">
        <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1" />
            <PostDetailNavigation post={normalizedPost} />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Post</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 self-start">
                <ChannelBadge
                  name={normalizedPost.channel.typeId === 'reddit' && normalizedPost.subreddit?.name ? `r/${normalizedPost.subreddit.name}` : normalizedPost.channel.name}
                  typeId={normalizedPost.channel.typeId}
                  size="md"
                />
                {normalizedPost.schedule && (
                  <ContentScheduleBadge
                    name={normalizedPost.schedule.name}
                    emoji={normalizedPost.schedule.emoji}
                    color={normalizedPost.schedule.color}
                    size="md"
                  />
                )}
              </div>
              <PostDetailMedia post={normalizedPost} />
              <PostDetailPostponeButton post={normalizedPost} />
            </div>
            <div className="flex flex-col gap-4">
              <PostDetailStatusButtons post={normalizedPost} />
              <PostDetailScheduleSelect post={normalizedPost} />
              <PostDetailDateTimeInputs post={normalizedPost} />
              <PostDetailUrlInput post={normalizedPost} />
              {normalizedPost.channel.typeId === 'fansly' && <PostDetailFanslyStatistics post={normalizedPost} />}
              <PostDetailCaptionInput post={normalizedPost} />
            </div>
          </div>
        </div>
      </div>
    </MediaDragProvider>
  );
};

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailRoute,
});


