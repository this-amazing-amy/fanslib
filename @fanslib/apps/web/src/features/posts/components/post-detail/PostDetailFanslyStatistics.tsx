import type { PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useDebounce } from '~/hooks/useDebounce';
import { useFetchFanslyDataMutation } from '~/lib/queries/analytics';
import { useUpdatePostMediaMutation } from '~/lib/queries/posts';

type Post = PostWithRelations;

type PostDetailFanslyStatisticsProps = {
  post: Post;
};

export const PostDetailFanslyStatistics = ({ post }: PostDetailFanslyStatisticsProps) => {
  if (post.postMedia.length === 0) {
    return (
      <div className="text-sm text-base-content/70">
        No media items in this post
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {post.postMedia.map((postMedia, index) => (
        <PostMediaStatisticsInput
          key={postMedia.id}
          postId={post.id}
          postMedia={postMedia}
          index={index}
        />
      ))}
    </div>
  );
};

type PostMediaStatisticsInputProps = {
  postId: string;
  postMedia: Post['postMedia'][number];
  index: number;
};

const PostMediaStatisticsInput = ({
  postId,
  postMedia,
  index,
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
        Media {index + 1}: {mediaName}
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
          <RefreshCw className={`h-4 w-4 ${fetchAnalyticsMutation.isPending ? 'animate-spin' : ''}`} />
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

