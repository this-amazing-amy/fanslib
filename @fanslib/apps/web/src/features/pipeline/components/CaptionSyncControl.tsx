import type { CaptionQueueItem } from '@fanslib/server/schemas';
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { Checkbox } from "~/components/ui/Checkbox";
import { eden } from "~/lib/api/eden";
import { cn } from "~/lib/cn";


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
  const postQueries = useQueries({
    queries: linkedPosts.map((linked) => ({
      queryKey: ["posts", linked.postId],
      queryFn: async () => {
        const result = await eden.api.posts["by-id"]({ id: linked.postId }).get();
        if (result.error) {
          return null;
        }
        return result.data ?? null;
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
    <div className="rounded-lg border border-base-300 p-3 space-y-2">
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
            <div
              key={linked.postId}
              className={cn(
                "flex items-center gap-3 p-2 rounded border transition-colors",
                isSelected ? "border-purple-500 bg-purple-50/50" : "border-base-300"
              )}
            >
              <Checkbox
                isSelected={isSelected}
                onChange={() => toggleLinkedPost(linked.postId)}
              />
              <div className="flex items-baseline gap-2 flex-shrink-0">
                <span className="text-sm font-semibold">
                  {format(new Date(linked.date), "EEE, MMM d")}
                </span>
                <span className="text-xs font-medium text-base-content/60">
                  {format(new Date(linked.date), "HH:mm")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {schedule && (
                  <ContentScheduleBadge
                    name={schedule.name}
                    emoji={schedule.emoji}
                    color={schedule.color}
                    size="sm"
                    borderStyle="none"
                    responsive={false}
                  />
                )}
                <ChannelBadge
                  name={channelName}
                  typeId={channel?.type?.id ?? channel?.typeId ?? linked.channelTypeId}
                  size="sm"
                  borderStyle="none"
                  responsive={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
