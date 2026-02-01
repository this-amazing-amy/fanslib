import type { PostWithRelations } from '@fanslib/server/schemas';
import { useState } from 'react';
import { DateTimePicker } from '~/components/DateTimePicker';
import { useDebounce } from '~/hooks/useDebounce';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = PostWithRelations;

type PostDetailDateTimeInputsProps = {
  post: Post;
};

export const PostDetailDateTimeInputs = ({ post }: PostDetailDateTimeInputsProps) => {
  const [localDate, setLocalDate] = useState(new Date(post.date));
  const [isSaving, setIsSaving] = useState(false);
  const updatePostMutation = useUpdatePostMutation();

  const saveDate = async (date: Date) => {
    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          date,
        },
      });
    } catch (error) {
      console.error('Failed to update date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveDate = useDebounce(saveDate, 300);

  const updateDate = (newDate: Date) => {
    setLocalDate(newDate);
    debouncedSaveDate(newDate);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Date & Time</label>
      <div className="relative">
        <DateTimePicker 
          date={localDate} 
          setDate={updateDate}
          preferredTimes={post.schedule?.preferredTimes ?? []}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="text-xs">Updating...</div>
          </div>
        )}
      </div>
    </div>
  );
};

