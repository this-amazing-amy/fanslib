import { useState } from "react";
import { useSkipScheduleSlotMutation } from "~/lib/queries/content-schedules";
import type { VirtualPost } from "~/lib/virtual-posts";

type UseSkipSlotConfirmationProps = {
  post: VirtualPost;
  onUpdate: () => Promise<void>;
};

export const useSkipSlotConfirmation = ({ post, onUpdate }: UseSkipSlotConfirmationProps) => {
  const [hasSkipConfirmation, setHasSkipConfirmation] = useState(false);
  const skipSlotMutation = useSkipScheduleSlotMutation();

  const skipScheduleSlot = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasSkipConfirmation) {
      setHasSkipConfirmation(true);
      return;
    }

    if (!post.scheduleId) {
      setHasSkipConfirmation(false);
      return;
    }

    await skipSlotMutation.mutateAsync({
      scheduleId: post.scheduleId,
      date: post.date,
    });

    await onUpdate();
    setHasSkipConfirmation(false);
  };

  const resetSkipConfirmation = () => setHasSkipConfirmation(false);

  return {
    hasSkipConfirmation,
    skipScheduleSlot,
    resetSkipConfirmation,
    isSkipPending: skipSlotMutation.isPending,
  };
};
