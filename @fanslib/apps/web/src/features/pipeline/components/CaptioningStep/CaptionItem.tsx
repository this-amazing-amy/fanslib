import type { CaptionQueueItem, CaptionQueueItemSchema, PostStatus, PostStatusSchema } from '@fanslib/server/schemas';
import type { Key } from "@react-types/shared";
import { format } from "date-fns";
import { Circle, CheckCircle2, ExternalLink, Link2, MoreVertical, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SnippetSelector } from "~/components/SnippetSelector";
import { HashtagButton } from "~/components/HashtagButton";
import { MediaView } from "~/components/MediaView";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/Textarea";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useDebounce } from "~/hooks/useDebounce";
import { cn } from "~/lib/cn";
import { useDeletePostMutation, useUpdatePostMutation } from "~/lib/queries/posts";
import { useMediaTagsQuery } from "~/lib/queries/tags";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { TagBadge } from "~/features/library/components/MediaTagEditor/DimensionTagSelector/TagBadge";
import { CaptionSyncControl } from "~/features/pipeline/components/CaptionSyncControl";
import { RelatedCaptionsPanel } from "~/features/pipeline/components/RelatedCaptionsPanel";
import { useLinkedPostsContext } from "./LinkedPostsContext";


const getCompletionStatus = (channelTypeId: string): PostStatus =>
  ["bluesky", "reddit"].includes(channelTypeId) ? "scheduled" : "ready";

type CaptionItemProps = {
  item: CaptionQueueItem;
  isExpanded: boolean;
  onExpand: () => void;
  onAdvance: () => void;
};

export const CaptionItem = ({ item, isExpanded, onExpand, onAdvance }: CaptionItemProps) => {
  const queryClient = useQueryClient();
  const { linkedPostIdsForExpanded, setLinkedPostIds, setExpandedPostId } = useLinkedPostsContext();
  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();
  const [localCaption, setLocalCaption] = useState(item.post.caption ?? "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const firstMedia = item.post.postMedia?.[0]?.media;
  const { data: mediaTagsData } = useMediaTagsQuery({ 
    mediaId: firstMedia?.id ?? "" 
  });
  const mediaTags = mediaTagsData ?? [];

  const linkedPostIds = useMemo(
    () => item.linkedPosts.map((linked) => linked.postId),
    [item.linkedPosts]
  );
  const [selectedLinkedPostIds, setSelectedLinkedPostIds] = useState<string[]>(linkedPostIds);

  useEffect(() => {
    setLocalCaption(item.post.caption ?? "");
  }, [item.post.id, item.post.caption]);

  useEffect(() => {
    setSelectedLinkedPostIds(linkedPostIds);
    setLinkedPostIds(item.post.id, linkedPostIds);
  }, [linkedPostIds, item.post.id, setLinkedPostIds]);

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
    [item.post.id, updatePostMutation]
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
    
    console.log('Saving with updates:', updates);
    
    try {
      const result = await updatePostMutation.mutateAsync({
        id: item.post.id,
        updates,
      });
      console.log('Update result:', result);
      queryClient.invalidateQueries({ queryKey: ["pipeline", "caption-queue"] });
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
      await deletePostMutation.mutateAsync({ id: item.post.id });
      queryClient.invalidateQueries({ queryKey: ["pipeline", "caption-queue"] });
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

  const hasCaption = item.post.caption?.trim() ?? false;
  const channel = item.post.channel as { name: string; id: string; typeId: string; type?: { id: string } } | undefined;
  const schedule = item.post.schedule as { name: string; emoji: string | null; color: string | null } | null | undefined;
  const subreddit = item.post.subreddit as { name: string } | null | undefined;
  const channelName = channel?.typeId === "reddit" && subreddit?.name ? `r/${subreddit.name}` : channel?.name ?? "";

  return (
    <>
      <div className={cn("border rounded-lg relative", isLinkedToExpanded ? "border-purple-500" : "border-base-300")}>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Link
            to="/posts/$postId"
            params={{ postId: item.post.id }}
            className="text-base-content/60 hover:text-base-content transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-base-content/60 hover:text-base-content hover:bg-base-200"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            <DropdownMenuPopover placement="bottom end" className="w-48">
              <DropdownMenu onAction={handleMenuAction}>
                <DropdownMenuItem
                  id="delete"
                  className="flex items-center gap-2 text-sm font-medium text-destructive"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenu>
            </DropdownMenuPopover>
          </DropdownMenuTrigger>
        </div>
      <button
        type="button"
        onClick={onExpand}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {isLinkedToExpanded && (
            <Link2 className="w-4 h-4 text-purple-500" />
          )}
          {hasCaption ? (
            <CheckCircle2 className="w-5 h-5 text-base-content/60" />
          ) : (
            <Circle className="w-5 h-5 text-base-content/60" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold">
              {format(new Date(item.post.date), "EEE, MMM d")}
            </span>
            <span className="text-sm font-medium text-base-content/60">
              {format(new Date(item.post.date), "HH:mm")}
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
            {channel && (
              <ChannelBadge
                name={channelName}
                typeId={channel.type?.id ?? channel.typeId}
                size="sm"
                borderStyle="none"
                responsive={false}
              />
            )}
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-base-300 p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {firstMedia && (
                <div className="flex gap-4 items-start">
                  <div className="w-full aspect-square max-w-xs flex-shrink-0">
                    {firstMedia.type === "video" ? (
                      <MediaView media={firstMedia} controls />
                    ) : (
                      <MediaTileLite media={firstMedia} />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {mediaTags
                      .filter((tag) => tag.stickerDisplay && tag.stickerDisplay !== "none")
                      .map((tag) => (
                        <TagBadge
                          key={tag.id}
                          tag={{
                            id: tag.tagDefinitionId,
                            color: tag.color,
                            displayName: tag.shortRepresentation ?? tag.tagDisplayName,
                          }}
                          size="md"
                          selectionMode="radio"
                        />
                      ))}
                  </div>
                </div>
              )}
              {updatePostMutation.isPending && (
                <div className="flex justify-end">
                  <div className="text-xs text-base-content/60">Saving...</div>
                </div>
              )}
              <div className="relative">
                <Textarea
                  value={localCaption}
                  onChange={updateCaption}
                  onKeyDown={onKeyDown}
                  rows={10}
                  className="pr-10"
                  placeholder="Write a caption..."
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <SnippetSelector
                    channelId={item.post.channel.id}
                    caption={localCaption}
                    onCaptionChange={updateCaption}
                    className="text-base-content/60 hover:text-base-content"
                  />
                  <HashtagButton
                    channel={item.post.channel}
                    caption={localCaption}
                    onCaptionChange={updateCaption}
                    className="text-base-content/60 hover:text-base-content"
                  />
                </div>
              </div>
              <CaptionSyncControl
                linkedPosts={item.linkedPosts}
                selectedPostIds={selectedLinkedPostIds}
                onSelectionChange={handleLinkedPostSelectionChange}
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onAdvance}>
                  Skip
                </Button>
                <Button size="sm" onClick={saveAndAdvance}>
                  Save & Next
                </Button>
              </div>
            </div>
            <RelatedCaptionsPanel
              relatedByMedia={item.relatedByMedia}
              relatedByShoot={item.relatedByShoot}
              onUseCaption={updateCaption}
            />
          </div>
        </div>
      )}
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
