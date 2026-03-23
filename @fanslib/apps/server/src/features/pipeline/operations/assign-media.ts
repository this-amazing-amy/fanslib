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
import {
  getUsedMediaForSubreddit,
  selectRandomMedia,
} from "../../reddit-automation/operations/generation/utils";
import type { AssignMediaRequestBodySchema, AssignMediaResponseSchema } from "../schema";

type MediaFilters = z.infer<typeof MediaFilterSchema>;
type AssignMediaResult = z.infer<typeof AssignMediaResponseSchema>;

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
  items.reduce<T[]>(
    (acc, item) => (acc.some((existing) => existing.id === item.id) ? acc : [...acc, item]),
    [],
  );

const combineFilters = (
  baseFilters: MediaFilters | null,
  overrides: MediaFilters | null,
): MediaFilters | null => {
  if (!baseFilters && !overrides) return null;
  if (!baseFilters) return overrides;
  if (!overrides) return baseFilters;
  // Both filters exist, combine them
  return [...baseFilters, ...overrides];
};

const getChannelFilter = (
  schedule: ContentSchedule,
  channel: Channel,
  scheduleChannel?: ScheduleChannel,
): MediaFilters | null => {
  const parsedScheduleFilters = parseMediaFilters(schedule.mediaFilters);
  const baseFilters =
    parsedScheduleFilters ?? (channel.eligibleMediaFilter as MediaFilters | null) ?? null;
  const overrides = (scheduleChannel?.mediaFilterOverrides as MediaFilters | null) ?? null;
  return combineFilters(baseFilters, overrides);
};

const getSubredditFilter = (subreddit: Subreddit, channel: Channel): MediaFilters | null => {
  const subredditChannelFilter = subreddit.channel?.eligibleMediaFilter as MediaFilters | null;
  const channelFilter = channel.eligibleMediaFilter as MediaFilters | null;
  return subredditChannelFilter ?? channelFilter ?? null;
};

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
  existingUsedMediaIds: string[] = [],
): Promise<ScheduleAssignmentResult> => {
  const targetChannels = schedule.scheduleChannels;

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

    const slotResults = await targetChannels.reduce<
      Promise<{
        createdPosts: AssignedPost[];
        unfilled: AssignMediaResult["unfilled"];
        usedMediaIds: string[];
      }>
    >(
      async (channelPromise, scheduleChannel) => {
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
          [media.id],
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
      },
      Promise.resolve({ createdPosts: [], unfilled: [], usedMediaIds: state.usedMediaIds }),
    );

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
  existingUsedMediaIds: string[] = [],
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
      [media.id],
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
  payload: z.infer<typeof AssignMediaRequestBodySchema>,
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

  const channels = uniqueById(
    await channelRepo.find({
      where: {
        id: In(payload.channelIds),
      },
    }),
  );

  if (scheduleIdsFromChannels.length === 0) {
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

  const schedules = (await scheduleRepo
    .createQueryBuilder("schedule")
    .leftJoinAndSelect("schedule.scheduleChannels", "scheduleChannels")
    .leftJoinAndSelect("scheduleChannels.channel", "scChannel")
    .leftJoinAndSelect("scChannel.type", "scChannelType")
    .where("schedule.id IN (:...scheduleIds)", {
      scheduleIds: scheduleIdsFromChannels,
    })
    .getMany()) as ScheduleWithChannels[];

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

  const subreddits = await subredditRepo.find({
    relations: ["channel"],
  });

  const scheduleAssignments = await Promise.all(
    schedules.map(async (schedule) => {
      const targetChannels =
        schedule.scheduleChannels?.filter((sc) => payload.channelIds.includes(sc.channelId)) ?? [];

      if (targetChannels.length === 0) {
        return { createdPosts: [], unfilled: [] };
      }

      const schedulePosts = existingPosts.filter((post) => post.scheduleId === schedule.id);
      const allSlots = generateScheduleDates(schedule, fromDate, toDate).filter(
        (slot) => slot >= fromDate && slot <= toDate,
      );

      const slots = allSlots.filter(
        (slot) => !schedulePosts.some((post) => isSameMinute(new Date(post.date), slot)),
      );

      const redditChannel = targetChannels.find(
        (sc) => sc.channel?.typeId === CHANNEL_TYPES.reddit.id,
      );

      if (redditChannel) {
        return assignRedditScheduleSlots(
          schedule,
          redditChannel.channel,
          slots,
          subreddits,
          existingMediaIds,
        );
      }

      const scheduleWithFilteredChannels: ScheduleWithChannels = {
        ...schedule,
        scheduleChannels: targetChannels,
      };

      return assignStandardScheduleSlots(scheduleWithFilteredChannels, slots, existingMediaIds);
    }),
  );

  const createdPosts = scheduleAssignments.flatMap((assignment) => assignment.createdPosts);
  const unfilled = scheduleAssignments.flatMap((assignment) => assignment.unfilled);

  const summary = channels.map((channel) => {
    const channelPosts = createdPosts.filter((post) => post.channelId === channel.id);
    const uniqueMedia = Array.from(new Set(channelPosts.map((post) => post.mediaId)));
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
