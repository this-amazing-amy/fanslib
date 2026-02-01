import { t } from "elysia";
import type { z } from "zod";
import { Between, In } from "typeorm";
import { isSameMinute } from "date-fns";
import { db } from "../../../lib/db";
import { CHANNEL_TYPES } from "../../channels/channelTypes";
import { Channel } from "../../channels/entity";
import { ContentSchedule, ScheduleChannel } from "../../content-schedules/entity";
import { generateScheduleDates } from "../../content-schedules/operations/generate-virtual-posts";
import type { MediaFilterSchema } from "../../library/schemas/media-filter";
import { Post } from "../../posts/entity";
import { createPost } from "../../posts/operations/post/create";
import { Subreddit } from "../../subreddits/entity";
import { getUsedMediaForSubreddit, selectRandomMedia } from "../../reddit-automation/operations/generation/utils";

type MediaFilters = z.infer<typeof MediaFilterSchema>;

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
  postGroupId: string | null;
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] =>
  items.reduce<T[]>((acc, item) => (acc.some((existing) => existing.id === item.id) ? acc : [...acc, item]), []);

const combineFilters = (baseFilters: MediaFilters | null, overrides: MediaFilters | null): MediaFilters | null => {
  if (!baseFilters && !overrides) return null;
  if (!baseFilters) return overrides;
  if (!overrides) return baseFilters;
  return [...baseFilters, ...overrides];
};

const getChannelFilter = (
  schedule: ContentSchedule,
  channel: Channel,
  scheduleChannel?: ScheduleChannel
): MediaFilters | null => {
  const baseFilters = parseMediaFilters(schedule.mediaFilters) ?? channel.eligibleMediaFilter ?? null;
  const overrides = scheduleChannel?.mediaFilterOverrides ?? null;
  return combineFilters(baseFilters, overrides);
};

const getSubredditFilter = (subreddit: Subreddit, channel: Channel): MediaFilters | null =>
  subreddit.eligibleMediaFilter ?? channel.eligibleMediaFilter ?? null;

type ScheduleAssignmentResult = {
  createdPosts: AssignedPost[];
  unfilled: AssignMediaResult["unfilled"];
};

type ScheduleWithChannels = ContentSchedule & {
  scheduleChannels: (ScheduleChannel & { channel: Channel })[];
};

const assignStandardScheduleSlots = async (
  schedule: ScheduleWithChannels,
  slots: Date[],
  existingUsedMediaIds: string[] = []
): Promise<ScheduleAssignmentResult> => {
  const targetChannels = schedule.scheduleChannels.length > 0
    ? schedule.scheduleChannels
    : schedule.channel
      ? [{ channel: schedule.channel, scheduleId: schedule.id, channelId: schedule.channel.id, mediaFilterOverrides: null, sortOrder: 0, id: "", createdAt: new Date(), updatedAt: new Date() } as ScheduleChannel & { channel: Channel }]
      : [];

  if (targetChannels.length === 0) {
    return { createdPosts: [], unfilled: [] };
  }

  const initialState = {
    createdPosts: [] as AssignedPost[],
    unfilled: [] as AssignMediaResult["unfilled"],
    usedMediaIds: existingUsedMediaIds,
  };

  return slots.reduce<Promise<typeof initialState>>(async (promise, slotDate) => {
    const state = await promise;
    const postGroupId = targetChannels.length > 1 ? crypto.randomUUID() : null;

    const slotResults = await targetChannels.reduce<Promise<{
      createdPosts: AssignedPost[];
      unfilled: AssignMediaResult["unfilled"];
      usedMediaIds: string[];
    }>>(async (channelPromise, scheduleChannel) => {
      const channelState = await channelPromise;
      const eligibleFilter = getChannelFilter(schedule, scheduleChannel.channel, scheduleChannel);
      const { media } = await selectRandomMedia(eligibleFilter, channelState.usedMediaIds);

      if (!media) {
        return {
          ...channelState,
          unfilled: [
            ...channelState.unfilled,
            {
              scheduleId: schedule.id,
              channelId: scheduleChannel.channelId,
              date: slotDate,
              reason: "no_eligible_media" as const,
            },
          ],
        };
      }

      const created = await createPost(
        {
          date: slotDate,
          channelId: scheduleChannel.channelId,
          status: "draft",
          scheduleId: schedule.id,
          postGroupId,
        },
        [media.id]
      );

      return {
        ...channelState,
        createdPosts: [
          ...channelState.createdPosts,
          {
            channelId: scheduleChannel.channelId,
            mediaId: media.id,
            postId: created.id,
            postGroupId,
          },
        ],
        usedMediaIds: [...channelState.usedMediaIds, media.id],
      };
    }, Promise.resolve({ createdPosts: [], unfilled: [], usedMediaIds: state.usedMediaIds }));

    return {
      createdPosts: [...state.createdPosts, ...slotResults.createdPosts],
      unfilled: [...state.unfilled, ...slotResults.unfilled],
      usedMediaIds: slotResults.usedMediaIds,
    };
  }, Promise.resolve(initialState));
};

const assignRedditScheduleSlots = async (
  schedule: ScheduleWithChannels,
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
        channelId: channel.id,
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
            channelId: channel.id,
            date: slotDate,
            reason: "no_subreddits" as const,
          },
        ],
      };
    }

    const eligibleFilter = getSubredditFilter(subreddit, channel);
    const usedFromSubreddit = await getUsedMediaForSubreddit(subreddit.id, channel.id);
    const excludeIds = Array.from(new Set([...state.usedMediaIds, ...usedFromSubreddit]));
    const { media } = await selectRandomMedia(eligibleFilter, excludeIds);

    if (!media) {
      return {
        ...state,
        unfilled: [
          ...state.unfilled,
          {
            scheduleId: schedule.id,
            channelId: channel.id,
            date: slotDate,
            reason: "no_eligible_media" as const,
          },
        ],
      };
    }

    const created = await createPost(
      {
        date: slotDate,
        channelId: channel.id,
        status: "draft",
        scheduleId: schedule.id,
        subredditId: subreddit.id,
        postGroupId: null,
      },
      [media.id]
    );

    return {
      ...state,
      createdPosts: [
        ...state.createdPosts,
        {
          channelId: channel.id,
          mediaId: media.id,
          postId: created.id,
          postGroupId: null,
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
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);
  const postRepo = dataSource.getRepository(Post);
  const subredditRepo = dataSource.getRepository(Subreddit);
  const channelRepo = dataSource.getRepository(Channel);

  const fromDate = new Date(payload.fromDate);
  const toDate = new Date(payload.toDate);

  const scheduleChannels = await scheduleChannelRepo.find({
    where: { channelId: In(payload.channelIds) },
    select: { scheduleId: true },
  });
  const scheduleIdsFromChannels = [...new Set(scheduleChannels.map((sc) => sc.scheduleId))];

  const schedules = await scheduleRepo
    .createQueryBuilder("schedule")
    .leftJoinAndSelect("schedule.channel", "channel")
    .leftJoinAndSelect("channel.type", "channelType")
    .leftJoinAndSelect("schedule.scheduleChannels", "scheduleChannels")
    .leftJoinAndSelect("scheduleChannels.channel", "scChannel")
    .leftJoinAndSelect("scChannel.type", "scChannelType")
    .where("schedule.channelId IN (:...channelIds)", { channelIds: payload.channelIds.length > 0 ? payload.channelIds : ["__none__"] })
    .orWhere("schedule.id IN (:...scheduleIds)", { scheduleIds: scheduleIdsFromChannels.length > 0 ? scheduleIdsFromChannels : ["__none__"] })
    .getMany() as ScheduleWithChannels[];

  const channels = uniqueById(
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
      summary: channels.map((channel) => ({
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

  const existingMediaIds = existingPosts
    .flatMap((post) => post.postMedia?.map((pm) => pm.media?.id) ?? [])
    .filter((id): id is string => Boolean(id));

  const subreddits = await subredditRepo.find();

  const scheduleAssignments = await Promise.all(
    schedules.map(async (schedule) => {
      const targetChannels = schedule.scheduleChannels?.filter((sc) =>
        payload.channelIds.includes(sc.channelId)
      ) ?? [];

      const legacyChannel = schedule.channel && payload.channelIds.includes(schedule.channel.id)
        ? schedule.channel
        : null;

      if (targetChannels.length === 0 && !legacyChannel) {
        return { createdPosts: [], unfilled: [] };
      }

      const schedulePosts = existingPosts.filter((post) => post.scheduleId === schedule.id);
      const allSlots = generateScheduleDates(schedule, fromDate, toDate)
        .filter((slot) => slot >= fromDate && slot <= toDate);

      const slots = allSlots.filter(
        (slot) =>
          !schedulePosts.some((post) => isSameMinute(new Date(post.date), slot))
      );

      const hasRedditChannel = targetChannels.some((sc) => sc.channel?.typeId === CHANNEL_TYPES.reddit.id)
        || legacyChannel?.typeId === CHANNEL_TYPES.reddit.id;

      if (hasRedditChannel && legacyChannel?.typeId === CHANNEL_TYPES.reddit.id) {
        return assignRedditScheduleSlots(schedule, legacyChannel, slots, subreddits, existingMediaIds);
      }

      const scheduleWithFilteredChannels: ScheduleWithChannels = {
        ...schedule,
        scheduleChannels: targetChannels.length > 0 ? targetChannels : (legacyChannel ? [{
          id: "",
          scheduleId: schedule.id,
          channelId: legacyChannel.id,
          channel: legacyChannel,
          mediaFilterOverrides: null,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ScheduleChannel & { channel: Channel }] : []),
      };

      return assignStandardScheduleSlots(scheduleWithFilteredChannels, slots, existingMediaIds);
    })
  );

  const createdPosts = scheduleAssignments.flatMap((assignment) => assignment.createdPosts);
  const unfilled = scheduleAssignments.flatMap((assignment) => assignment.unfilled);

  const summary = channels.map((channel) => {
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
