import type { PostWithRelations } from '@fanslib/server/schemas';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { MediaPreview } from '~/components/MediaPreview';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { AnalyticsViewsChart } from '~/features/posts/components/post-detail/AnalyticsViewsChart';
import { useDebounce } from '~/hooks/useDebounce';
import { cn } from '~/lib/cn';
import { useFetchFanslyDataMutation, usePostMediaAnalyticsQuery } from '~/lib/queries/analytics';
import { useUpdatePostMediaMutation } from '~/lib/queries/posts';

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
        <div>
          <PostMediaStatisticsInput
            postId={post.id}
            postMedia={selectedPostMedia}
          />
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
      hasGap={analyticsData.hasGap}
      suggestedFetchRange={analyticsData.suggestedFetchRange}
    />
  );
};

type PostMediaStatisticsInputProps = {
  postId: string;
  postMedia: Post['postMedia'][number];
};

const PostMediaStatisticsInput = ({
  postId,
  postMedia,
}: PostMediaStatisticsInputProps) => {
  const localStatisticsId = postMedia.fanslyStatisticsId ?? '';
  const [localValue, setLocalValue] = useState(localStatisticsId);

  const updatePostMediaMutation = useUpdatePostMediaMutation();
  const fetchAnalyticsMutation = useFetchFanslyDataMutation();

  const parseStatisticsId = (input: string): string | null => {
    if (/^\d{18}$/.test(input)) {
      return input;
    }

    const urlMatch = input.match(/fansly\.com\/statistics\/(\d{18})/);
    if (urlMatch?.[1]) {
      return urlMatch[1];
    }

    if (input.trim() !== '') {
      return null;
    }

    return null;
  };

  const saveStatisticsId = async (value: string) => {
    const parsed = parseStatisticsId(value);
    
    try {
      await updatePostMediaMutation.mutateAsync({
        postId,
        postMediaId: postMedia.id,
        fanslyStatisticsId: parsed,
      });
    } catch (error) {
      console.error('Failed to update statistics ID:', error);
    }
  };

  const debouncedSave = useDebounce(saveStatisticsId, 1000);

  const mediaName = postMedia.media?.name ?? 'Unknown';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`fansly-statistics-id-${postMedia.id}`} className="text-sm font-medium">
        {mediaName}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={`fansly-statistics-id-${postMedia.id}`}
            placeholder="Enter ID or fansly.com/statistics/... URL"
            aria-label={`Fansly statistics ID for ${mediaName}`}
            value={localValue}
            onChange={(value) => {
              setLocalValue(value);
              debouncedSave(value);
            }}
            isDisabled={updatePostMediaMutation.isPending}
          />
          {updatePostMediaMutation.isPending && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="text-xs">Updating...</div>
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => fetchAnalyticsMutation.mutate({ postMediaId: postMedia.id })}
          isDisabled={fetchAnalyticsMutation.isPending || !postMedia.fanslyStatisticsId}
        >
          <RefreshCw className={cn('h-4 w-4', fetchAnalyticsMutation.isPending && 'animate-spin')} />
        </Button>
      </div>
      {postMedia.fanslyStatisticsId && (
        <a
          href={`https://fansly.com/statistics/${postMedia.fanslyStatisticsId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View on Fansly →
        </a>
      )}
    </div>
  );
};

