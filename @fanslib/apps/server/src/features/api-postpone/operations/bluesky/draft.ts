import { z } from "zod";
import { db } from "../../../../lib/db";
import { CHANNEL_TYPES } from "../../../channels/channelTypes";
import { Post } from "../../../posts/entity";
import { loadSettings } from "../../../settings/operations/setting/load";
import { SCHEDULE_BLUESKY_POST } from "../../queries";
import { fetchPostpone } from "../helpers";

export const DraftBlueskyPostRequestBodySchema = z.object({
  postId: z.string(),
});

export const DraftBlueskyPostResponseSchema = z.object({
  success: z.boolean(),
});

type ScheduleBlueskyPostMutationResult = {
  scheduleBlueskyPost: {
    success: boolean;
    errors?: Array<{ message: string }>;
  };
};

type ScheduleBlueskyPostMutationVariables = {
  input: {
    username: string;
    postAt: string;
    publishingStatus: string;
    thread: Array<{
      text: string;
      order: number;
      contentWarning: string;
      languages: string[];
      mediaName?: string;
      removeAtAmount?: number;
      removeAtUnit?: string;
    }>;
  };
};

export const draftBlueskyPost = async (data: z.infer<typeof DraftBlueskyPostRequestBodySchema>): Promise<z.infer<typeof DraftBlueskyPostResponseSchema>> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);

  const settings = await loadSettings();
  if (!settings.blueskyUsername) {
    throw new Error("Bluesky username not configured. Please add it in Settings.");
  }

  const post = await postRepository.findOne({
    where: { id: data.postId },
    relations: {
      channel: true,
      postMedia: {
        media: true,
      },
    },
  });

  if (!post) {
    throw new Error(`Post with id ${data.postId} not found`);
  }

  if (post.channel.typeId !== CHANNEL_TYPES.bluesky.id) {
    throw new Error("Post is not for Bluesky channel");
  }

  if (post.postponeBlueskyDraftedAt) {
    return { success: true };
  }

  const media = post.postMedia[0];

  const threadSubmission = {
    text: post.caption,
    order: 1,
    contentWarning: "PORN",
    languages: ["en"],
    mediaName: media?.media.name,
    ...(settings.blueskyDefaultExpiryDays && {
      removeAtAmount: settings.blueskyDefaultExpiryDays,
      removeAtUnit: "day",
    }),
  };

  const result = await fetchPostpone<
    ScheduleBlueskyPostMutationResult,
    ScheduleBlueskyPostMutationVariables
  >(SCHEDULE_BLUESKY_POST, {
    input: {
      username: settings.blueskyUsername,
      postAt: new Date(post.date).toISOString(),
      publishingStatus: "DRAFT",
      thread: [
        {
          ...threadSubmission,
          text: threadSubmission.text ?? "",
        },
      ],
    },
  });

  if (result.scheduleBlueskyPost.success) {
    await postRepository.update(post.id, {
      postponeBlueskyDraftedAt: new Date(),
      updatedAt: new Date().toISOString(),
    });
  }

  return { success: result.scheduleBlueskyPost.success };
};

