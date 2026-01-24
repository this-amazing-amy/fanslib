import { t } from "elysia";
import { Between, In } from "typeorm";
import { isSameMinute } from "date-fns";
import { db } from "../../../lib/db";
import { CHANNEL_TYPES } from "../../channels/channelTypes";
import { Channel } from "../../channels/entity";
import { ContentSchedule } from "../../content-schedules/entity";
import { generateScheduleDates } from "../../content-schedules/operations/generate-virtual-posts";
import type { MediaFilterSchema } from "../../library/schemas/media-filter";
import { Post } from "../../posts/entity";
import { createPost } from "../../posts/operations/post/create";
import { Subreddit } from "../../subreddits/entity";
import { getUsedMediaForSubreddit, selectRandomMedia } from "../../reddit-automation/operations/generation/utils";

type MediaFilters = typeof MediaFilterSchema.static;

export const AssignMediaRequestBodySchema = t.Object({
  channelIds: t.Array(t.String()),
  fromDate: t.String(),
  toDate: t.String(),
});

const UnfilledReasonSchema = t.Union([t.Literal("no_eligible_media"), t.Literal("no_subreddits")]);

export const AssignMediaResponseSchema = t.Object({
  created: t.Number(),
  unfilled: t.Array(
    t.Object({
      scheduleId: t.String(),
      channelId: t.String(),
      date: t.Date(),
      reason: UnfilledReasonSchema,
    })
  ),
  summary: t.Array(
    t.Object({
      channelId: t.String(),
      channelName: t.String(),
      draftsCreated: t.Number(),
      uniqueMediaUsed: t.Number(),
    })
  ),
});

type AssignMediaResult = typeof AssignMediaResponseSchema.static;

const parseMediaFilters = (mediaFilters?: string | null): MediaFilters | null => {
  if (!mediaFilters) return null;
  try {
    return JSON.parse(mediaFilters);
  } catch {
    return null;
  }
};

type AssignedPost = {
  channelId: string;
  mediaId: string;
  postId: string;
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] =>
  items.reduce<T[]>((acc, item) => (acc.some((existing) => existing.id === item.id) ? acc : [...acc, item]), []);

const getChannelFilter = (schedule: ContentSchedule, channel: Channel): MediaFilters | null =>
  parseMediaFilters(schedule.mediaFilters) ?? channel.eligibleMediaFilter ?? null;

const getSubredditFilter = (subreddit: Subreddit, channel: Channel): MediaFilters | null =>
  subreddit.eligibleMediaFilter ?? channel.eligibleMediaFilter ?? null;

type ScheduleAssignmentResult = {
  createdPosts: AssignedPost[];
  unfilled: AssignMediaResult["unfilled"];
};

const assignStandardScheduleSlots = async (
  schedule: ContentSchedule,
  channel: Channel,
  slots: Date[],
  existingUsedMediaIds: string[] = []
): Promise<ScheduleAssignmentResult> => {
  const eligibleFilter = getChannelFilter(schedule, channel);

  const initialState = {
    createdPosts: [] as AssignedPost[],
    unfilled: [] as AssignMediaResult["unfilled"],
    usedMediaIds: existingUsedMediaIds,
  };

  return slots.reduce<Promise<typeof initialState>>(async (promise, slotDate) => {
    const state = await promise;
    const { media } = await selectRandomMedia(eligibleFilter, state.usedMediaIds);

    if (!media) {
      return {
        ...state,
        unfilled: [
          ...state.unfilled,
          {
            scheduleId: schedule.id,
            channelId: schedule.channelId,
            date: slotDate,
            reason: "no_eligible_media" as const,
          },
        ],
      };
    }

    const created = await createPost(
      {
        date: slotDate,
        channelId: schedule.channelId,
        status: "draft",
        scheduleId: schedule.id,
      },
      [media.id]
    );

    return {
      ...state,
      createdPosts: [
        ...state.createdPosts,
        {
          channelId: schedule.channelId,
          mediaId: media.id,
          postId: created.id,
        },
      ],
      usedMediaIds: [...state.usedMediaIds, media.id],
    };
  }, Promise.resolve(initialState));
};

const assignRedditScheduleSlots = async (
  schedule: ContentSchedule,
  channel: Channel,
  slots: Date[],
  subreddits: Subreddit[],
  existingUsedMediaIds: string[] = []
): Promise<ScheduleAssignmentResult> => {
  if (subreddits.length === 0) {
    return {
      createdPosts: [],
      unfilled: slots.map((slotDate) => ({
        scheduleId: schedule.id,
        channelId: schedule.channelId,
        date: slotDate,
        reason: "no_subreddits" as const,
      })),
    };
  }

  const initialState = {
    createdPosts: [] as AssignedPost[],
    unfilled: [] as AssignMediaResult["unfilled"],
    usedMediaIds: existingUsedMediaIds,
  };

  return slots.reduce<Promise<typeof initialState>>(async (promise, slotDate, index) => {
    const state = await promise;
    const subreddit = subreddits[index % subreddits.length] ?? subreddits[0];

    if (!subreddit) {
      return {
        ...state,
        unfilled: [
          ...state.unfilled,
          {
            scheduleId: schedule.id,
            channelId: schedule.channelId,
            date: slotDate,
            reason: "no_subreddits" as const,
          },
        ],
      };
    }

    const eligibleFilter = getSubredditFilter(subreddit, channel);
    const usedFromSubreddit = await getUsedMediaForSubreddit(subreddit.id, schedule.channelId);
    const excludeIds = Array.from(new Set([...state.usedMediaIds, ...usedFromSubreddit]));
    const { media } = await selectRandomMedia(eligibleFilter, excludeIds);

    if (!media) {
      return {
        ...state,
        unfilled: [
          ...state.unfilled,
          {
            scheduleId: schedule.id,
            channelId: schedule.channelId,
            date: slotDate,
            reason: "no_eligible_media" as const,
          },
        ],
      };
    }

    const created = await createPost(
      {
        date: slotDate,
        channelId: schedule.channelId,
        status: "draft",
        scheduleId: schedule.id,
        subredditId: subreddit.id,
      },
      [media.id]
    );

    return {
      ...state,
      createdPosts: [
        ...state.createdPosts,
        {
          channelId: schedule.channelId,
          mediaId: media.id,
          postId: created.id,
        },
      ],
      usedMediaIds: [...state.usedMediaIds, media.id],
    };
  }, Promise.resolve(initialState));
};

export const assignMediaToSchedules = async (
  payload: typeof AssignMediaRequestBodySchema.static
): Promise<AssignMediaResult> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const postRepo = dataSource.getRepository(Post);
  const subredditRepo = dataSource.getRepository(Subreddit);
  const channelRepo = dataSource.getRepository(Channel);

  const fromDate = new Date(payload.fromDate);
  const toDate = new Date(payload.toDate);

  const schedules = await scheduleRepo.find({
    where: {
      channelId: In(payload.channelIds),
    },
    relations: {
      channel: {
        type: true,
      },
    },
  });

  const channelIds = uniqueById(
    await channelRepo.find({
      where: {
        id: In(payload.channelIds),
      },
    })
  );

  if (schedules.length === 0) {
    return {
      created: 0,
      unfilled: [],
      summary: channelIds.map((channel) => ({
        channelId: channel.id,
        channelName: channel.name,
        draftsCreated: 0,
        uniqueMediaUsed: 0,
      })),
    };
  }

  const existingPosts = await postRepo.find({
    where: {
      scheduleId: In(schedules.map((schedule) => schedule.id)),
      date: Between(fromDate, toDate),
    },
    relations: {
      postMedia: {
        media: true,
      },
    },
  });

  // Extract all media IDs from existing posts to avoid reusing them
  const existingMediaIds = existingPosts
    .flatMap((post) => post.postMedia?.map((pm) => pm.media?.id) ?? [])
    .filter((id): id is string => Boolean(id));

  const subreddits = await subredditRepo.find();

  const scheduleAssignments = await Promise.all(
    schedules.map(async (schedule) => {
      const schedulePosts = existingPosts.filter((post) => post.scheduleId === schedule.id);
      const allSlots = generateScheduleDates(schedule, fromDate, toDate)
        .filter((slot) => slot >= fromDate && slot <= toDate);
      
      const slots = allSlots.filter(
        (slot) =>
          !schedulePosts.some((post) => isSameMinute(new Date(post.date), slot))
      );

      if (schedule.channel.typeId === CHANNEL_TYPES.reddit.id) {
        return assignRedditScheduleSlots(schedule, schedule.channel, slots, subreddits, existingMediaIds);
      }

      return assignStandardScheduleSlots(schedule, schedule.channel, slots, existingMediaIds);
    })
  );

  const createdPosts = scheduleAssignments.flatMap((assignment) => assignment.createdPosts);
  const unfilled = scheduleAssignments.flatMap((assignment) => assignment.unfilled);

  const summary = channelIds.map((channel) => {
    const channelPosts = createdPosts.filter((post) => post.channelId === channel.id);
    const uniqueMedia = Array.from(
      new Set(channelPosts.map((post) => post.mediaId))
    );
    return {
      channelId: channel.id,
      channelName: channel.name,
      draftsCreated: channelPosts.length,
      uniqueMediaUsed: uniqueMedia.length,
    };
  });

  return {
    created: createdPosts.length,
    unfilled,
    summary,
  };
};
