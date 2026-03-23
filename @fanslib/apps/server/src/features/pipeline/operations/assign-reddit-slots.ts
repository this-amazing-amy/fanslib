import type { z } from "zod";
import type { Channel } from "../../channels/entity";
import type {
	ContentSchedule,
	ScheduleChannel,
} from "../../content-schedules/entity";
import { createPost } from "../../posts/operations/post/create";
import {
	getUsedMediaForSubreddit,
	selectRandomMedia,
} from "../../reddit-automation/operations/generation/utils";
import type { Subreddit } from "../../subreddits/entity";
import type { AssignMediaResponseSchema } from "../schema";
import type { AssignedPost, MediaFilters } from "./assign-helpers";

type AssignMediaResult = z.infer<typeof AssignMediaResponseSchema>;

type ScheduleAssignmentResult = {
	createdPosts: AssignedPost[];
	unfilled: AssignMediaResult["unfilled"];
};

type ScheduleWithChannels = ContentSchedule & {
	scheduleChannels: (ScheduleChannel & { channel: Channel })[];
};

export const getSubredditFilter = (
	subreddit: Subreddit,
	channel: Channel,
): MediaFilters | null => {
	const subredditChannelFilter = subreddit.channel
		?.eligibleMediaFilter as MediaFilters | null;
	const channelFilter = channel.eligibleMediaFilter as MediaFilters | null;
	return subredditChannelFilter ?? channelFilter ?? null;
};

export const assignRedditScheduleSlots = async (
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

	return slots.reduce<Promise<typeof initialState>>(
		async (promise, slotDate, index) => {
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
			const usedFromSubreddit = await getUsedMediaForSubreddit(
				subreddit.id,
				channel.id,
			);
			const excludeIds = Array.from(
				new Set([...state.usedMediaIds, ...usedFromSubreddit]),
			);
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
		},
		Promise.resolve(initialState),
	);
};
