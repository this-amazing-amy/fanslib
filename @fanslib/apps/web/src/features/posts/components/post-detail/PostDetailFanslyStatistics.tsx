import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useDebounce } from '~/hooks/useDebounce';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailFanslyStatisticsProps = {
  post: Post;
};

export const PostDetailFanslyStatistics = ({ post }: PostDetailFanslyStatisticsProps) => {
  const [localStatisticsId, setLocalStatisticsId] = useState(post.fanslyStatisticsId ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const updatePostMutation = useUpdatePostMutation();

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
    
    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          fanslyStatisticsId: parsed,
        },
      });
    } catch (error) {
      console.error('Failed to update statistics ID:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveStatisticsId = useDebounce(saveStatisticsId, 1000);

  const updateStatisticsId = (newValue: string) => {
    setLocalStatisticsId(newValue);
    debouncedSaveStatisticsId(newValue);
  };

  const fetchAnalytics = async () => {
    if (!post.fanslyStatisticsId) {
      return;
    }

    setIsFetching(true);
    try {
      console.log('Analytics fetch would happen here - requires backend API');
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="fansly-statistics-id" className="text-sm font-medium">
        Fansly Statistics ID
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="fansly-statistics-id"
            placeholder="Enter ID or fansly.com/statistics/... URL"
            value={localStatisticsId}
            onChange={updateStatisticsId}
            isDisabled={isSaving}
          />
          {isSaving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="text-xs">Updating...</div>
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={fetchAnalytics}
          isDisabled={isFetching || !post.fanslyStatisticsId}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

