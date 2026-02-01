import { z } from "zod";
import { MediaSchema } from "../library/schema";

export const PostStatusSchema = z.enum([
  'draft',
  'ready',
  'scheduled',
  'posted',
]);

export const PostMediaSchema = z.object({
  id: z.string(),
  order: z.number(),
  isFreePreview: z.boolean(),
  fanslyStatisticsId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PostMediaWithMediaSchema = PostMediaSchema.extend({
  media: MediaSchema,
});

export const PostSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  postGroupId: z.string().nullable(),
  scheduleId: z.string().nullable(),
  caption: z.string().nullable(),
  date: z.coerce.date(),
  url: z.string().nullable(),
  fypRemovedAt: z.coerce.date().nullable(),
  fypManuallyRemoved: z.boolean(),
  postponeBlueskyDraftedAt: z.coerce.date().nullable(),
  blueskyPostUri: z.string().nullable(),
  blueskyPostError: z.string().nullable(),
  blueskyRetryCount: z.number(),
  status: PostStatusSchema,
  channelId: z.string(),
  subredditId: z.string().nullable(),
});

