import type { PostWithRelations } from '@fanslib/server/schemas';
import { useState } from 'react';
import { MediaPreview } from '~/components/MediaPreview';
import { Button } from '~/components/ui/Button';
import { AnalyticsViewsChart } from '~/features/posts/components/post-detail/AnalyticsViewsChart';
import { cn } from '~/lib/cn';
import { useFetchFanslyDataMutation, usePostMediaAnalyticsQuery } from '~/lib/queries/analytics';

type Post = PostWithRelations;

type PostDetailAnalyticsProps = {
  post: Post;
};

export const PostDetailAnalytics = ({ post }: PostDetailAnalyticsProps) => {
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(
    post.postMedia[0]?.id ?? null
  );

  if (post.channel.typeId !== 'fansly') {
    return null;
  }

  if (post.postMedia.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
        <div className="text-sm text-base-content/70">
          No media items in this post
        </div>
      </div>
    );
  }

  const selectedPostMedia = post.postMedia.find((pm) => pm.id === selectedMediaId) ?? post.postMedia[0];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {post.postMedia.map((postMedia, index) => {
            const isSelected = postMedia.id === selectedMediaId;
            return (
              <button
                key={postMedia.id}
                onClick={() => setSelectedMediaId(postMedia.id)}
                className={cn(
                  'flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300 hover:border-base-content/30'
                )}
                aria-label={`View analytics for media ${index + 1}`}
              >
                <MediaPreview
                  media={postMedia.media}
                  className="w-16 h-16"
                />
              </button>
            );
          })}
        </div>
        {selectedPostMedia.fanslyStatisticsId && (
          <PostMediaAnalyticsChart
            postMediaId={selectedPostMedia.id}
          />
        )}
      </div>
    </div>
  );
};

type PostMediaAnalyticsChartProps = {
  postMediaId: string;
};

const PostMediaAnalyticsChart = ({ postMediaId }: PostMediaAnalyticsChartProps) => {
  const { data: analyticsData, isLoading } = usePostMediaAnalyticsQuery(postMediaId);
  const fetchAnalyticsMutation = useFetchFanslyDataMutation();

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center h-48">
        <div className="text-sm text-base-content/70">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.datapoints.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center h-48 gap-4">
        <div className="text-sm text-base-content/70">No analytics data available</div>
        <Button
          onClick={() => fetchAnalyticsMutation.mutate({ postMediaId })}
          isDisabled={fetchAnalyticsMutation.isPending}
        >
          {fetchAnalyticsMutation.isPending ? 'Fetching...' : 'Fetch Analytics'}
        </Button>
      </div>
    );
  }

  return (
    <AnalyticsViewsChart
      datapoints={analyticsData.datapoints}
      postDate={analyticsData.postDate}
      postMediaId={postMediaId}
    />
  );
};
