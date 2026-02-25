import type { CaptionQueueItem } from '@fanslib/server/schemas';
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link2 } from "lucide-react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { api } from "~/lib/api/hono-client";
import { cn } from "~/lib/cn";
import { usePrefersReducedMotion } from "~/hooks/usePrefersReducedMotion";


type CaptionSyncControlProps = {
  linkedPosts: CaptionQueueItem["linkedPosts"];
  selectedPostIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export const CaptionSyncControl = ({
  linkedPosts,
  selectedPostIds,
  onSelectionChange,
}: CaptionSyncControlProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const postQueries = useQueries({
    queries: linkedPosts.map((linked) => ({
      queryKey: ["posts", linked.postId],
      queryFn: async () => {
        const result = await api.api.posts['by-id'][':id'].$get({ param: { id: linked.postId } });
        if (!result.ok) {
          return null;
        }
        return await result.json();
      },
      enabled: !!linked.postId,
    })),
  });

  if (linkedPosts.length === 0) {
    return null;
  }

  const toggleLinkedPost = (postId: string) => {
    const next = selectedPostIds.includes(postId)
      ? selectedPostIds.filter((id) => id !== postId)
      : [...selectedPostIds, postId];
    onSelectionChange(next);
  };

  return (
    <div className="rounded-lg py-3 space-y-2">
      <div className="text-sm font-medium">Sync caption to</div>
      <div className="space-y-2">
        {linkedPosts.map((linked, index) => {
          const postQuery = postQueries[index];
          const post = postQuery.data && typeof postQuery.data === "object" && "id" in postQuery.data ? postQuery.data : null;
          const channel = post?.channel as { name: string; typeId: string; type?: { id: string } } | undefined;
          const schedule = post?.schedule as { name: string; emoji: string | null; color: string | null } | null | undefined;
          const subreddit = post?.subreddit as { name: string } | null | undefined;
          const channelName = channel?.typeId === "reddit" && subreddit?.name ? `r/${subreddit.name}` : channel?.name ?? linked.channelName;
          const isSelected = selectedPostIds.includes(linked.postId);

          return (
            <div key={linked.postId} className="flex items-stretch">
              <div
                className={cn(
                  "flex flex-col justify-center flex-shrink-0 overflow-hidden ease-out",
                  isSelected ? "w-9" : "w-0 min-w-0",
                  !prefersReducedMotion && "transition-[width] duration-200"
                )}
              >
                <Link2 className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => toggleLinkedPost(linked.postId)}
                className={cn(
                  "flex items-center gap-3 py-2 pl-2 pr-0 rounded border flex-1 min-w-0 text-left cursor-pointer transition-colors hover:bg-base-200/50",
                  isSelected ? "ring-2 ring-primary border-primary" : "border-black"
                )}
              >
                <div className="flex items-baseline gap-2 flex-shrink-0 min-w-0 flex-1">
                  <span className="text-sm font-semibold">
                    {format(new Date(linked.date), "EEE, MMM d")}
                  </span>
                  <span className="text-xs font-medium text-base-content/60">
                    {format(new Date(linked.date), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 @container w-[4.5rem]">
                  {schedule && (
                    <ContentScheduleBadge
                      name={schedule.name}
                      emoji={schedule.emoji}
                      color={schedule.color}
                      size="sm"
                      borderStyle="none"
                      responsive
                      className="p-1"
                    />
                  )}
                  <ChannelBadge
                    name={channelName}
                    typeId={channel?.type?.id ?? channel?.typeId ?? linked.channelTypeId}
                    size="sm"
                    borderStyle="none"
                    responsive
                    className="p-1"
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
