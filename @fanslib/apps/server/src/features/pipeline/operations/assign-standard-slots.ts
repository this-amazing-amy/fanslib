import type { z } from "zod";
import type { Channel } from "../../channels/entity";
import type {
	ContentSchedule,
	ScheduleChannel,
} from "../../content-schedules/entity";
import { createPost } from "../../posts/operations/post/create";
import { selectRandomMedia } from "../../reddit-automation/operations/generation/utils";
import type { AssignMediaResponseSchema } from "../schema";
import {
	type AssignedPost,
	combineFilters,
	type MediaFilters,
	parseMediaFilters,
} from "./assign-helpers";

type AssignMediaResult = z.infer<typeof AssignMediaResponseSchema>;

type ScheduleAssignmentResult = {
	createdPosts: AssignedPost[];
	unfilled: AssignMediaResult["unfilled"];
};

export type ScheduleWithChannels = ContentSchedule & {
	scheduleChannels: (ScheduleChannel & { channel: Channel })[];
};

export const getChannelFilter = (
	schedule: ContentSchedule,
	channel: Channel,
	scheduleChannel?: ScheduleChannel,
): MediaFilters | null => {
	const parsedScheduleFilters = parseMediaFilters(schedule.mediaFilters);
	const baseFilters =
		parsedScheduleFilters ??
		(channel.eligibleMediaFilter as MediaFilters | null) ??
		null;
	const overrides =
		(scheduleChannel?.mediaFilterOverrides as MediaFilters | null) ?? null;
	return combineFilters(baseFilters, overrides);
};

export const assignStandardScheduleSlots = async (
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

	return slots.reduce<Promise<typeof initialState>>(
		async (promise, slotDate) => {
			const state = await promise;
			const postGroupId =
				targetChannels.length > 1 ? crypto.randomUUID() : null;

			const slotResults = await targetChannels.reduce<
				Promise<{
					createdPosts: AssignedPost[];
					unfilled: AssignMediaResult["unfilled"];
					usedMediaIds: string[];
				}>
			>(
				async (channelPromise, scheduleChannel) => {
					const channelState = await channelPromise;
					const eligibleFilter = getChannelFilter(
						schedule,
						scheduleChannel.channel,
						scheduleChannel,
					);
					const { media } = await selectRandomMedia(
						eligibleFilter,
						channelState.usedMediaIds,
					);

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
				Promise.resolve({
					createdPosts: [],
					unfilled: [],
					usedMediaIds: state.usedMediaIds,
				}),
			);

			return {
				createdPosts: [...state.createdPosts, ...slotResults.createdPosts],
				unfilled: [...state.unfilled, ...slotResults.unfilled],
				usedMediaIds: slotResults.usedMediaIds,
			};
		},
		Promise.resolve(initialState),
	);
};
