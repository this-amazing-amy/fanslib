import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ChannelBadge } from '~/components/ChannelBadge';
import { Button } from '~/components/ui/Button';
import { PostDetailCaptionInput } from '~/features/posts/components/post-detail/PostDetailCaptionInput';
import { PostDetailDateTimeInputs } from '~/features/posts/components/post-detail/PostDetailDateTimeInputs';
import { PostDetailDeleteButton } from '~/features/posts/components/post-detail/PostDetailDeleteButton';
import { PostDetailFanslyStatistics } from '~/features/posts/components/post-detail/PostDetailFanslyStatistics';
import { PostDetailMedia } from '~/features/posts/components/post-detail/PostDetailMedia';
import { PostDetailNavigation } from '~/features/posts/components/post-detail/PostDetailNavigation';
import { PostDetailPostponeButton } from '~/features/posts/components/post-detail/PostDetailPostponeButton';
import { PostDetailStatusButtons } from '~/features/posts/components/post-detail/PostDetailStatusButtons';
import { PostDetailUrlInput } from '~/features/posts/components/post-detail/PostDetailUrlInput';
import { usePostQuery } from '~/lib/queries/posts';

const PostDetailRoute = () => {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePostQuery({ id: postId });

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
        <Button onClick={() => navigate({ to: '/plan' })}>Back to Plan</Button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/plan' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex-1" />
          <PostDetailNavigation post={post} />
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Post</h1>
          <div className="flex items-center gap-2">
            <PostDetailDeleteButton post={post} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="self-start">
              <ChannelBadge
                name={post.subreddit ? `r/${post.subreddit.name}` : post.channel.name}
                typeId={post.subreddit ? 'reddit' : post.channel.typeId}
                size="lg"
              />
            </div>
            <PostDetailMedia post={post} />
            <PostDetailPostponeButton post={post} />
          </div>
          <div className="flex flex-col gap-4">
            <PostDetailStatusButtons post={post} />
            <PostDetailDateTimeInputs post={post} />
            <PostDetailUrlInput post={post} />
            {post.channel.typeId === 'fansly' && <PostDetailFanslyStatistics post={post} />}
            <PostDetailCaptionInput post={post} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailRoute,
});


