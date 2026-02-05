import { isSameDay } from 'date-fns';
import type { ReactNode } from 'react';
import { usePostDrag } from '~/contexts/PostDragContext';
import { useDragOver } from '~/hooks/useDragOver';
import { cn } from '~/lib/cn';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type PostCalendarDayContainerProps = {
  date: Date;
  onUpdate: () => Promise<void>;
  children: ReactNode;
  className?: string;
};

export const PostCalendarDayContainer = ({
  date,
  onUpdate,
  children,
  className,
}: PostCalendarDayContainerProps) => {
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();
  const updatePostMutation = useUpdatePostMutation();

  const { isOver, dragHandlers } = useDragOver({
    onDrop: async () => {
      if (!isPostDragging || !draggedPost) return;

      const originalDate = new Date(draggedPost.date);

      // Don't do anything if dropped on the same day
      if (isSameDay(originalDate, date)) {
        endPostDrag();
        return;
      }

      // Preserve the original time, only change the date
      const newDate = new Date(date);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
      newDate.setSeconds(originalDate.getSeconds());

      try {
        await updatePostMutation.mutateAsync({
          id: draggedPost.id,
          updates: { date: newDate },
        });
        await onUpdate();
      } catch (error) {
        console.error('Failed to move post to new date:', error);
      }

      endPostDrag();
    },
  });

  // Only show visual feedback when dragging a post (not media)
  const showDropFeedback = isPostDragging && draggedPost;

  return (
    <div
      {...dragHandlers}
      className={cn(
        className,
        'transition-colors',
        showDropFeedback && isOver && 'bg-primary/10 ring-2 ring-primary/50 ring-inset'
      )}
    >
      {children}
    </div>
  );
};
