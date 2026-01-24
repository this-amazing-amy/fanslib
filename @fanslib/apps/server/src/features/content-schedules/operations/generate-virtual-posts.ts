import { t } from "elysia";
import { Between, In } from "typeorm";
import { isSameMinute } from "date-fns";
import { db } from "../../../lib/db";
import { ContentSchedule } from "../entity";
import { Post } from "../../posts/entity";
import { PostWithRelationsSchema } from "../../posts/operations/post/fetch-all";
import { generateScheduleDates } from "../schedule-dates";

export { generateScheduleDates } from "../schedule-dates";

export const FetchVirtualPostsRequestQuerySchema = t.Object({
  channelIds: t.Array(t.String()),
  fromDate: t.String(),
  toDate: t.String(),
});

export const VirtualPostSchema = t.Composite([
  PostWithRelationsSchema,
  t.Object({
    isVirtual: t.Literal(true),
  }),
]);

export const FetchVirtualPostsResponseSchema = t.Array(VirtualPostSchema);

const toScheduleResponse = (schedule: ContentSchedule) => ({
  id: schedule.id,
  channelId: schedule.channelId,
  name: schedule.name,
  emoji: schedule.emoji,
  color: schedule.color,
  type: schedule.type,
  postsPerTimeframe: schedule.postsPerTimeframe,
  preferredDays: schedule.preferredDays,
  preferredTimes: schedule.preferredTimes,
  updatedAt: schedule.updatedAt,
  createdAt: schedule.createdAt,
  mediaFilters: schedule.mediaFilters,
});

const toVirtualPost = (schedule: ContentSchedule, slotDate: Date) => ({
  id: `virtual-${schedule.id}-${slotDate.getTime()}`,
  createdAt: slotDate,
  updatedAt: slotDate,
  scheduleId: schedule.id,
  caption: "",
  date: slotDate,
  url: null,
  fypRemovedAt: null,
  postponeBlueskyDraftedAt: null,
  blueskyPostUri: null,
  blueskyPostError: null,
  blueskyRetryCount: 0,
  status: "draft" as const,
  channelId: schedule.channelId,
  subredditId: null,
  postMedia: [],
  channel: schedule.channel,
  subreddit: null,
  schedule: toScheduleResponse(schedule),
  isVirtual: true as const,
});

export const fetchVirtualPosts = async (
  params: typeof FetchVirtualPostsRequestQuerySchema.static
): Promise<typeof FetchVirtualPostsResponseSchema.static> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const postRepo = dataSource.getRepository(Post);

  const fromDate = new Date(params.fromDate);
  const toDate = new Date(params.toDate);

  const schedules = await scheduleRepo.find({
    where: {
      channelId: In(params.channelIds),
    },
    relations: {
      channel: {
        type: true,
        defaultHashtags: true,
      },
      skippedSlots: true,
    },
  });

  const scheduleIds = schedules.map((schedule) => schedule.id);
  if (scheduleIds.length === 0) {
    return [];
  }

  const existingPosts = await postRepo.find({
    select: {
      id: true,
      scheduleId: true,
      date: true,
    },
    where: {
      scheduleId: In(scheduleIds),
      date: Between(fromDate, toDate),
    },
  });

  return schedules.flatMap((schedule) => {
    const slots = generateScheduleDates(schedule, fromDate, toDate);
    const availableSlots = slots.filter((slotDate) => {
      const isTaken = existingPosts.some(
        (post) =>
          post.scheduleId === schedule.id &&
          isSameMinute(new Date(post.date), slotDate)
      );
      const isSkipped = (schedule.skippedSlots ?? []).some((slot) =>
        isSameMinute(new Date(slot.date), slotDate)
      );
      return !isTaken && !isSkipped;
    });
    return availableSlots.map((slotDate) => toVirtualPost(schedule, slotDate));
  });
};
