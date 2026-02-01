import type { CreatePostRequestBody, CreatePostRequestBodySchema } from '@fanslib/server/schemas';
import { useNavigate } from "@tanstack/react-router";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { useDraftBlueskyMutation } from "~/lib/queries/postpone";
import { useCreatePostMutation } from "~/lib/queries/posts";
import { useSettingsQuery } from "~/lib/queries/settings";
import type { VirtualPost } from "~/lib/virtual-posts";

type CreatePostFromVirtualSlotArgs = {
  virtualPost: VirtualPost;
  mediaIds: string[];
  caption?: string;
  onUpdate?: () => Promise<void>;
};

export const useCreatePostFromVirtualSlot = () => {
  const navigate = useNavigate();
  const { preferences } = usePostPreferences();
  const { data: settings } = useSettingsQuery();
  const createPostMutation = useCreatePostMutation();
  const draftBlueskyMutation = useDraftBlueskyMutation();

  const createPostFromVirtualSlot = async ({
    virtualPost,
    mediaIds,
    caption,
    onUpdate,
  }: CreatePostFromVirtualSlotArgs): Promise<void> => {
    const targetChannelTypeId = virtualPost.channel.type?.id ?? virtualPost.channel.typeId;
    const shouldAutoDraftBluesky =
      preferences.view.autoDraftBlueskyOnDrop &&
      targetChannelTypeId === "bluesky" &&
      !!settings?.postponeToken &&
      !!settings?.blueskyUsername;

    try {
      const createdPost = await createPostMutation.mutateAsync({
        date: virtualPost.date,
        channelId: virtualPost.channelId,
        status: "draft",
        caption: caption ?? "",
        mediaIds,
        scheduleId: virtualPost.scheduleId,
      } satisfies CreatePostRequestBody);

      if (!createdPost?.id) {
        return;
      }

      await onUpdate?.();

      if (shouldAutoDraftBluesky) {
        await draftBlueskyMutation.mutateAsync({ postId: createdPost.id });
      }

      if (targetChannelTypeId === "bluesky") {
        navigate({ to: "/posts/$postId", params: { postId: createdPost.id } });
      }
    } catch (error) {
      console.error("Failed to create post from virtual slot:", error);
    }
  };

  return { createPostFromVirtualSlot };
};

