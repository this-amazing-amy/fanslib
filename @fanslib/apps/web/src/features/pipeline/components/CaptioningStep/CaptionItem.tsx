import type { CaptionQueueItem, Media, PostStatus } from "@fanslib/server/schemas";
import type { Key } from "@react-types/shared";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";
import { useDebounce } from "~/hooks/useDebounce";
import { usePrefersReducedMotion } from "~/hooks/usePrefersReducedMotion";
import { cn } from "~/lib/cn";
import { api } from "~/lib/api/hono-client";
import { useDeletePostMutation, useUpdatePostMutation } from "~/lib/queries/posts";
import { useLinkedPostsContext } from "./LinkedPostsContext";
import { CaptionItemHeader } from "./CaptionItemHeader";
import { CaptionItemEditor } from "./CaptionItemEditor";

const getCompletionStatus = (channelTypeId: string): PostStatus =>
  ["bluesky", "reddit"].includes(channelTypeId) ? "scheduled" : "ready";

type CaptionItemProps = {
  item: CaptionQueueItem;
  isExpanded: boolean;
  onExpand: () => void;
  onAdvance: () => void;
};

export const CaptionItem = ({ item, isExpanded, onExpand, onAdvance }: CaptionItemProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { linkedPostIdsForExpanded, setLinkedPostIds, setExpandedPostId } = useLinkedPostsContext();
  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();
  const [localCaption, setLocalCaption] = useState(item.post.caption ?? "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const postMedia = item.post.postMedia ?? [];

  // Fetch tags for all media items using useQueries
  const mediaTagQueries = useQueries({
    queries: postMedia.map((pm) => ({
      queryKey: ["tags", "media", pm.media.id],
      queryFn: async () => {
        const result = await api.api.tags.media["by-media-id"][":mediaId"].$get({
          param: { mediaId: pm.media.id },
          query: {},
        });
        return result.json();
      },
      enabled: !!pm.media.id,
    })),
  });

  const linkedPostIds = useMemo(
    () => item.linkedPosts.map((linked) => linked.postId),
    [item.linkedPosts],
  );
  const [selectedLinkedPostIds, setSelectedLinkedPostIds] = useState<string[]>(linkedPostIds);

  useEffect(() => {
    setLocalCaption(item.post.caption ?? "");
  }, [item.post.id, item.post.caption]);

  useEffect(() => {
    setSelectedLinkedPostIds(linkedPostIds);
    setLinkedPostIds(item.post.id, linkedPostIds);
    // oxlint-disable-next-line react/exhaustive-deps -- linkedPostIds and setLinkedPostIds are stable references, including them causes infinite re-renders
  }, [item.post.id]);

  useEffect(() => {
    if (isExpanded) {
      setExpandedPostId(item.post.id);
    }
  }, [isExpanded, item.post.id, setExpandedPostId]);

  const handleLinkedPostSelectionChange = (ids: string[]) => {
    setSelectedLinkedPostIds(ids);
    setLinkedPostIds(item.post.id, ids);
  };

  const isLinkedToExpanded = linkedPostIdsForExpanded.has(item.post.id);

  const saveCaption = useCallback(
    async (caption: string, syncToPostIds: string[]) => {
      try {
        await updatePostMutation.mutateAsync({
          id: item.post.id,
          updates: {
            caption: caption.trim() || null,
            syncToPostIds: syncToPostIds.length > 0 ? syncToPostIds : undefined,
          },
        });
      } catch (error) {
        console.error("Failed to save caption:", error);
      }
    },
    [item.post.id, updatePostMutation],
  );

  const debouncedSaveCaption = useDebounce(saveCaption, 1000);

  const updateCaption = (nextCaption: string) => {
    setLocalCaption(nextCaption);
    debouncedSaveCaption(nextCaption, selectedLinkedPostIds);
  };

  const saveAndAdvance = async () => {
    const status = getCompletionStatus(item.post.channel.type.id);
    const updates = {
      caption: localCaption.trim() ? localCaption.trim() : null,
      status,
      syncToPostIds: selectedLinkedPostIds.length > 0 ? selectedLinkedPostIds : undefined,
    };

    try {
      await updatePostMutation.mutateAsync({
        id: item.post.id,
        updates,
      });
      onAdvance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Failed to save and advance:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      alert(`Failed to save: ${errorMessage}`);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      saveAndAdvance();
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(item.post.id);
      onAdvance();
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleMenuAction = (key: Key) => {
    const actionId = String(key);
    if (actionId === "delete") {
      setIsDeleteDialogOpen(true);
    }
  };

  const channel = item.post.channel as
    | { name: string; id: string; typeId: string; type?: { id: string } }
    | undefined;
  const schedule = item.post.schedule as
    | { name: string; emoji: string | null; color: string | null }
    | null
    | undefined;
  const subreddit = item.post.subreddit as { name: string } | null | undefined;
  const channelName =
    channel?.typeId === "reddit" && subreddit?.name ? `r/${subreddit.name}` : (channel?.name ?? "");

  return (
    <>
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex flex-col justify-center flex-shrink-0 overflow-hidden ease-out",
            isLinkedToExpanded ? "w-9" : "w-0 min-w-0",
            !prefersReducedMotion && "transition-[width] duration-200",
          )}
        >
          <Link2 className="w-6 h-6 text-primary flex-shrink-0" />
        </div>
        <div
          className={cn(
            "border rounded-lg relative flex-1 min-w-0",
            isLinkedToExpanded ? "ring-2 ring-primary border-primary" : "border-black",
          )}
        >
          <CaptionItemHeader
            postId={item.post.id}
            date={item.post.date}
            channel={channel}
            channelName={channelName}
            schedule={schedule}
            onExpand={onExpand}
            onMenuAction={handleMenuAction}
          />
          {isExpanded && (
            <CaptionItemEditor
              item={item}
              postMedia={postMedia as unknown as Array<{ id: string; media: Media }>}
              mediaTagQueries={mediaTagQueries}
              localCaption={localCaption}
              updateCaption={updateCaption}
              onKeyDown={onKeyDown}
              selectedLinkedPostIds={selectedLinkedPostIds}
              onLinkedPostSelectionChange={handleLinkedPostSelectionChange}
              onAdvance={onAdvance}
              onSaveAndAdvance={saveAndAdvance}
            />
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone. This will permanently delete the post and remove it from all associated media."
        onConfirm={handleDelete}
        isLoading={deletePostMutation.isPending}
      />
    </>
  );
};
