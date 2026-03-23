import type { z } from "zod";
import type { MediaFilterSchema } from "../../library/schemas/media-filter";

export type MediaFilters = z.infer<typeof MediaFilterSchema>;

export type AssignedPost = {
	channelId: string;
	mediaId: string;
	postId: string;
	postGroupId: string | null;
};

export const parseMediaFilters = (
	mediaFilters?: string | null,
): MediaFilters | null => {
	if (!mediaFilters) return null;
	try {
		return JSON.parse(mediaFilters);
	} catch {
		return null;
	}
};

export const uniqueById = <T extends { id: string }>(items: T[]): T[] =>
	items.reduce<T[]>(
		(acc, item) =>
			acc.some((existing) => existing.id === item.id) ? acc : [...acc, item],
		[],
	);

export const combineFilters = (
	baseFilters: MediaFilters | null,
	overrides: MediaFilters | null,
): MediaFilters | null => {
	if (!baseFilters && !overrides) return null;
	if (!baseFilters) return overrides;
	if (!overrides) return baseFilters;
	// Both filters exist, combine them
	return [...baseFilters, ...overrides];
};
