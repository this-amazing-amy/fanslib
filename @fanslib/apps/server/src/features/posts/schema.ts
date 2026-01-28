import { t } from "elysia";
import { MediaSchema } from "../library/schema";

export const PostStatusSchema = t.Union([
  t.Literal('draft'),
  t.Literal('ready'),
  t.Literal('scheduled'),
  t.Literal('posted'),
]);

export const PostMediaSchema = t.Object({
  id: t.String(),
  order: t.Number(),
  isFreePreview: t.Boolean(),
  fanslyStatisticsId: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const PostMediaWithMediaSchema = t.Composite([
  PostMediaSchema,
  t.Object({
    media: MediaSchema,
  }),
]);

export const PostSchema = t.Object({
  id: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  postGroupId: t.Nullable(t.String()),
  scheduleId: t.Nullable(t.String()),
  caption: t.Nullable(t.String()),
  date: t.Date(),
  url: t.Nullable(t.String()),
  fypRemovedAt: t.Nullable(t.Date()),
  postponeBlueskyDraftedAt: t.Nullable(t.Date()),
  blueskyPostUri: t.Nullable(t.String()),
  blueskyPostError: t.Nullable(t.String()),
  blueskyRetryCount: t.Number(),
  status: PostStatusSchema,
  channelId: t.String(),
  subredditId: t.Nullable(t.String()),
});

