import { z } from "zod";
import { ChannelSchema } from "../channels/entity";
import { ContentScheduleSchema } from "../content-schedules/entity";
import { PostMediaSchema, PostSchema } from "../posts/schema";
import { ShootSchema } from "../shoots/entity";
import { SubredditSchema } from "../subreddits/entity";

export const AssignMediaRequestBodySchema = z.object({
  channelIds: z.array(z.string()),
  fromDate: z.string(),
  toDate: z.string(),
});

const UnfilledReasonSchema = z.union([z.literal("no_eligible_media"), z.literal("no_subreddits")]);

export const AssignMediaResponseSchema = z.object({
  created: z.number(),
  unfilled: z.array(
    z.object({
      scheduleId: z.string(),
      channelId: z.string(),
      date: z.coerce.date(),
      reason: UnfilledReasonSchema,
    })
  ),
  summary: z.array(
    z.object({
      channelId: z.string(),
      channelName: z.string(),
      draftsCreated: z.number(),
      uniqueMediaUsed: z.number(),
    })
  ),
});

export const FetchCaptionQueueRequestQuerySchema = z.object({
  channelIds: z.string(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const RelatedCaptionSchema = z.object({
  postId: z.string(),
  caption: z.string().nullable(),
  channelName: z.string(),
  channelTypeId: z.string(),
  date: z.coerce.date(),
});

const RelatedShootCaptionSchema = RelatedCaptionSchema.extend({
  shootName: z.string(),
});

const LinkedPostSchema = z.object({
  postId: z.string(),
  caption: z.string().nullable(),
  channelName: z.string(),
  channelTypeId: z.string(),
  date: z.coerce.date(),
});

const PostMediaWithMediaAndShootsSchema = PostMediaSchema.extend({
  media: z.object({
    id: z.string(),
    relativePath: z.string(),
    type: z.any(),
    name: z.string(),
    size: z.number(),
    duration: z.any(),
    shoots: z.array(ShootSchema),
  }),
});

const CaptionQueuePostSchema = PostSchema.extend({
  postMedia: z.array(PostMediaWithMediaAndShootsSchema),
  channel: ChannelSchema,
  subreddit: SubredditSchema.nullable(),
  schedule: ContentScheduleSchema.nullable(),
});

export const CaptionQueueItemSchema = z.object({
  post: CaptionQueuePostSchema,
  relatedByMedia: z.array(RelatedCaptionSchema),
  relatedByShoot: z.array(RelatedShootCaptionSchema),
  linkedPosts: z.array(LinkedPostSchema),
});

export const FetchCaptionQueueResponseSchema = z.array(CaptionQueueItemSchema);
