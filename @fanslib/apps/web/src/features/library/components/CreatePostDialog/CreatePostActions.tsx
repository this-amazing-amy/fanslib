import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";
import type { VirtualPost } from "~/lib/virtual-posts";

type CreatePostActionsProps = {
  scheduleId?: string;
  selectedMediaCount: number;
  disabled: boolean;
  confirmSkip: boolean;
  virtualPost?: VirtualPost;
  onNavigateToSlot?: (post: VirtualPost) => void;
  onSkipSlot: () => void;
  onConfirmSkipLeave: () => void;
  onCreatePost: (shouldNavigateToNext: boolean) => void;
  onClose: () => void;
};

export const CreatePostActions = ({
  scheduleId,
  selectedMediaCount,
  disabled,
  confirmSkip,
  virtualPost,
  onNavigateToSlot,
  onSkipSlot,
  onConfirmSkipLeave,
  onCreatePost,
  onClose,
}: CreatePostActionsProps) => (
  <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
    <div className="flex gap-2 w-full">
      {scheduleId && selectedMediaCount === 0 && (
        <Button
          variant="ghost"
          onPress={onSkipSlot}
          className="flex-1"
          onMouseLeave={onConfirmSkipLeave}
        >
          {confirmSkip ? "Click again to confirm skip" : "Skip This Slot"}
        </Button>
      )}
      {virtualPost && onNavigateToSlot ? (
        <>
          <Button
            onPress={() => {
              onCreatePost(false);
              onClose();
            }}
            className="flex-1"
            isDisabled={disabled}
          >
            Create Post
          </Button>
          <Button
            onPress={() => {
              onCreatePost(true);
            }}
            className="flex-1"
            isDisabled={disabled}
          >
            Create & Next
          </Button>
        </>
      ) : (
        <Button
          onPress={() => {
            onCreatePost(false);
            onClose();
          }}
          className={cn(scheduleId && selectedMediaCount === 0 ? "flex-1" : "w-full")}
          isDisabled={disabled}
        >
          Create post
        </Button>
      )}
    </div>
    {virtualPost && (
      <Link
        to="/content/library"
        className="text-sm text-center text-base-content/60 hover:text-base-content underline"
        onClick={onClose}
      >
        Browse Full Library
      </Link>
    )}
  </div>
);
