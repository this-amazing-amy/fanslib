import type { PostWithRelations } from '@fanslib/server/schemas';
import { isVirtualPost, type VirtualPost } from './virtual-posts';

type Post = PostWithRelations;

type FindNextUnfilledSlotParams = {
  currentPost: VirtualPost;
  allPosts: (Post | VirtualPost)[];
};

/**
 * Finds the next unfilled virtual post slot chronologically.
 * 
 * Logic:
 * - Starts from current post's date
 * - Looks for subsequent virtual posts (unfilled slots)
 * - Wraps to beginning if no future slots exist
 * - Returns null if all slots are filled
 */
export const findNextUnfilledSlot = ({
  currentPost,
  allPosts,
}: FindNextUnfilledSlotParams): VirtualPost | null => {
  const virtualPosts = allPosts.filter(isVirtualPost);
  
  if (virtualPosts.length === 0) return null;

  const currentDate = new Date(currentPost.date);
  const currentChannelId = currentPost.channelId;

  // Filter to same channel, sort chronologically
  const channelVirtualPosts = virtualPosts
    .filter((p) => p.channelId === currentChannelId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (channelVirtualPosts.length === 0) return null;

  // Find future slots (after current date)
  const futureSlots = channelVirtualPosts.filter(
    (p) => new Date(p.date).getTime() > currentDate.getTime()
  );

  if (futureSlots.length > 0) {
    return futureSlots[0] ?? null;
  }

  // Wrap to beginning - find earliest slot
  const earliestSlot = channelVirtualPosts[0];
  
  // If we're already at the earliest slot, there's nowhere to go
  if (earliestSlot && earliestSlot.date === currentPost.date) {
    return null;
  }

  return earliestSlot ?? null;
};
