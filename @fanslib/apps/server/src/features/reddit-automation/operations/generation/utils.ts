import type { z } from "zod";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { buildFilterGroupQuery } from "../../../library/filter-helpers";
import type { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { PostMedia } from "../../../posts/entity";
import { fetchPostsByMediaId } from "../../../posts/operations/post/fetch-by-media-id";
import type { Subreddit } from "../../../subreddits/entity";

type MediaFilters = z.infer<typeof MediaFilterSchema>;

const MEDIA_REUSE_RESTRICTION_DAYS = 30;

export const selectRandomMedia = async (
  eligibleMediaFilter: MediaFilters | null,
  excludeMediaIds?: string[]
): Promise<{ media: Media | null; totalAvailable: number }> => {
  const mediaRepo = (await db()).getRepository(Media);

  const query = mediaRepo.createQueryBuilder("media");

  if (eligibleMediaFilter) {
    buildFilterGroupQuery(eligibleMediaFilter, query);
  }

  if (excludeMediaIds && excludeMediaIds.length > 0) {
    query.andWhere("media.id NOT IN (:...excludeMediaIds)", { excludeMediaIds });
  }

  const totalAvailable = await query.getCount();

  if (totalAvailable === 0) {
    return { media: null, totalAvailable: 0 };
  }

  const randomOffset = Math.floor(Math.random() * totalAvailable);
  const media = await query.offset(randomOffset).limit(1).getOne();

  return { media, totalAvailable };
};


export const selectRandomMediaWithConflictChecking = async (
  subreddit: Subreddit,
  channelId: string
): Promise<{ media: Media | null; totalAvailable: number; usedMediaCount: number }> => {
  const filters = subreddit.eligibleMediaFilter;

  const usedMediaIds = await getUsedMediaForSubreddit(subreddit.id, channelId);

  const result = await selectRandomMedia(filters, usedMediaIds);

  return {
    ...result,
    usedMediaCount: usedMediaIds.length,
  };
};

export const removeHashtagsFromEnd = (caption: string): string => {
  if (!caption) return "";
  return caption.replace(/#[^\s]*(\s+#[^\s]*)*\s*$/, "").trim();
};

export const generateCaptionForMedia = async (media: Media): Promise<string> => {
  const posts = await fetchPostsByMediaId(media.id);

  const postsWithCaptions = posts
    .filter((post) => post.caption && post.caption.trim().length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const caption = postsWithCaptions.length > 0 ? postsWithCaptions[0]?.caption ?? "" : "";
  return removeHashtagsFromEnd(caption);
};

export const selectSubreddit = (subreddits: Subreddit[]): Subreddit | undefined => {
  if (subreddits.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * subreddits.length);
  return subreddits[randomIndex];
};

export const getSubredditPosts = <T extends { subredditId: string | null }>(channelPosts: T[], subredditId: string): T[] =>
  channelPosts.filter((post) => post.subredditId === subredditId);

export const getUsedMediaForSubreddit = async (
  subredditId: string,
  channelId: string,
  restrictionDays: number = MEDIA_REUSE_RESTRICTION_DAYS
): Promise<string[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - restrictionDays);
  const cutoffDateString = cutoffDate.toISOString();

  const usedMediaResults = await (await db()).getRepository(PostMedia)
    .createQueryBuilder("postMedia")
    .innerJoin("postMedia.post", "post")
    .innerJoin("postMedia.media", "media")
    .select("media.id")
    .where("post.subredditId = :subredditId", { subredditId })
    .andWhere("post.channelId = :channelId", { channelId })
    .andWhere("post.date >= :cutoffDate", { cutoffDate: cutoffDateString })
    .getRawMany();

  return usedMediaResults.map((result) => result.media_id);
};

const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60000);

const hasConflict = <T extends { date: Date }>(targetDate: Date, existingPosts: T[], minSpacingMinutes = 5): boolean => existingPosts.some((post) => {
    const postDate = post.date;
    const timeDiff = Math.abs(targetDate.getTime() - postDate.getTime());
    return timeDiff < minSpacingMinutes * 60000;
  });

const getSearchStartDate = (now: Date): Date => {
  const searchStartDate = new Date(now);
  searchStartDate.setMinutes(0, 0, 0);
  searchStartDate.setHours(searchStartDate.getHours() + 1);
  return searchStartDate;
};

const roundToNextHour = (date: Date): Date => {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0);
  if (date.getMinutes() > 0) {
    rounded.setHours(rounded.getHours() + 1);
  }
  return rounded;
};

const calculateMinAllowedPostTime = <T extends { date: Date }>(
  searchStartDate: Date,
  subreddit: Subreddit,
  subredditPosts: T[]
): Date => {
  const minTimeBetweenPosts = subreddit.maxPostFrequencyHours ?? 0;

  if (minTimeBetweenPosts === 0 || subredditPosts.length === 0) {
    return new Date(searchStartDate);
  }

  const lastPost = subredditPosts
    .map((p) => p.date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const minNextPostTime = addMinutes(lastPost ?? new Date(), minTimeBetweenPosts * 60);

  return minNextPostTime > searchStartDate
    ? roundToNextHour(minNextPostTime)
    : new Date(searchStartDate);
};

const createDateForDay = (baseDate: Date, dayOffset: number): Date => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  return date;
};

const createCandidateDate = (baseDate: Date, hour: number): Date => {
  const date = new Date(baseDate);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const isValidTimeSlot = <T extends { date: Date }>(candidateDate: Date, now: Date, minAllowedPostTime: Date, channelPosts: T[]): boolean => candidateDate > now &&
    candidateDate >= minAllowedPostTime &&
    !hasConflict(candidateDate, channelPosts, 5);

type SubredditPostingTime = {
  day: number;
  hour: number;
  score: number;
};

const getValidTimeSlotsForDay = <T extends { date: Date }>(
  dayDate: Date,
  postingTimes: SubredditPostingTime[],
  now: Date,
  minAllowedPostTime: Date,
  channelPosts: T[]
): Array<{ date: Date; score: number }> => {
  const dayOfWeek = dayDate.getDay();

  const dayPostingTimes = postingTimes.filter((pt) => pt.day === dayOfWeek);

  if (dayPostingTimes.length === 0) {
    return [];
  }

  return dayPostingTimes
    .map(({ hour, score }) => ({
      date: createCandidateDate(dayDate, hour),
      score,
    }))
    .filter(({ date }) => isValidTimeSlot(date, now, minAllowedPostTime, channelPosts));
};

const getBestTimeSlotForDay = (timeSlots: Array<{ date: Date; score: number }>): { date: Date; score: number } | null => timeSlots.reduce(
    (best, current) => (!best || current.score > best.score ? current : best),
    null as { date: Date; score: number } | null
  );

const generateFallbackDate = <T extends { subredditId: string | null; date: Date }>(minAllowedPostTime: Date, channelPosts: T[]): Date => {
  const generateCandidates = (startTime: Date): Date[] => Array.from({ length: 48 }, (_, i) => addMinutes(startTime, i * 30));

  return (
    generateCandidates(minAllowedPostTime).find((date) => !hasConflict(date, channelPosts, 5)) ??
    minAllowedPostTime
  );
};

export const calculateOptimalScheduleDate = <T extends { subredditId: string | null; date: Date }>(
  subreddit: Subreddit,
  subredditPosts: T[],
  channelPosts: T[]
): Date => {
  const postingTimes = (subreddit.postingTimesData ?? []) as SubredditPostingTime[];
  const now = new Date();
  const maxDaysToLookAhead = 14;
  const searchStartDate = getSearchStartDate(now);
  const minAllowedPostTime = calculateMinAllowedPostTime(searchStartDate, subreddit, subredditPosts);

  if (postingTimes.length === 0) {
    return generateFallbackDate(minAllowedPostTime, channelPosts);
  }

  const dayOffsets = Array.from({ length: maxDaysToLookAhead }, (_, i) => i);

  const bestTimeSlot = dayOffsets
    .map((dayOffset) => createDateForDay(searchStartDate, dayOffset))
    .map((dayDate) =>
      getValidTimeSlotsForDay(dayDate, postingTimes, now, minAllowedPostTime, channelPosts)
    )
    .map(getBestTimeSlotForDay)
    .find((timeSlot) => timeSlot !== null);

  if (bestTimeSlot) {
    bestTimeSlot.date = addMinutes(bestTimeSlot.date, Math.floor(Math.random() * 30));
  }

  return bestTimeSlot?.date ?? generateFallbackDate(minAllowedPostTime, channelPosts);
};



