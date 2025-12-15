import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useState } from 'react';
import { ContentScheduleSelect } from '~/components/ContentScheduleSelect';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailScheduleSelectProps = {
  post: Post;
};

export const PostDetailScheduleSelect = ({ post }: PostDetailScheduleSelectProps) => {
  const [localScheduleId, setLocalScheduleId] = useState<string | null>(post.scheduleId ?? null);
  const updatePostMutation = useUpdatePostMutation();

  const updateSchedule = async (scheduleId: string | null) => {
    setLocalScheduleId(scheduleId);

    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          scheduleId,
        },
      });
    } catch (error) {
      console.error('Failed to update content schedule:', error);
    }
  };

  const isSaving = updatePostMutation.isPending;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Content schedule</label>
      <div className="relative">
        <ContentScheduleSelect
          value={localScheduleId}
          onChange={updateSchedule}
          channelId={post.channelId}
        />
        {isSaving && (
          <div className="absolute right-0 -top-5 text-xs">
            Updating...
          </div>
        )}
      </div>
    </div>
  );
};

