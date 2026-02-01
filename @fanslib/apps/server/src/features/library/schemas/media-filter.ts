import { z } from "zod";

export const FilterItemChannelSchema = z.object({
  type: z.literal('channel'),
  id: z.string(),
});

export const FilterItemSubredditSchema = z.object({
  type: z.literal('subreddit'),
  id: z.string(),
});

export const FilterItemTagSchema = z.object({
  type: z.literal('tag'),
  id: z.string(),
});

export const FilterItemShootSchema = z.object({
  type: z.literal('shoot'),
  id: z.string(),
});

export const FilterItemFilenameSchema = z.object({
  type: z.literal('filename'),
  value: z.string(),
});

export const FilterItemCaptionSchema = z.object({
  type: z.literal('caption'),
  value: z.string(),
});

export const FilterItemPostedSchema = z.object({
  type: z.literal('posted'),
  value: z.boolean(),
});

export const FilterItemCreatedDateStartSchema = z.object({
  type: z.literal('createdDateStart'),
  value: z.coerce.date(),
});

export const FilterItemCreatedDateEndSchema = z.object({
  type: z.literal('createdDateEnd'),
  value: z.coerce.date(),
});

export const FilterItemMediaTypeSchema = z.object({
  type: z.literal('mediaType'),
  value: z.enum(['image', 'video']),
});

export const FilterItemDimensionEmptySchema = z.object({
  type: z.literal('dimensionEmpty'),
  dimensionId: z.number(),
});

export const FilterItemSchema = z.discriminatedUnion('type', [
  FilterItemChannelSchema,
  FilterItemSubredditSchema,
  FilterItemTagSchema,
  FilterItemShootSchema,
  FilterItemFilenameSchema,
  FilterItemCaptionSchema,
  FilterItemPostedSchema,
  FilterItemCreatedDateStartSchema,
  FilterItemCreatedDateEndSchema,
  FilterItemMediaTypeSchema,
  FilterItemDimensionEmptySchema,
]);

export const FilterGroupSchema = z.object({
  include: z.boolean(),
  items: z.array(FilterItemSchema),
});

export const MediaFilterSchema = z.array(FilterGroupSchema);