import { t } from "elysia";

export const FilterItemChannelSchema = t.Object({
  type: t.Literal('channel'),
  id: t.String(),
});

export const FilterItemSubredditSchema = t.Object({
  type: t.Literal('subreddit'),
  id: t.String(),
});

export const FilterItemTagSchema = t.Object({
  type: t.Literal('tag'),
  id: t.String(),
});

export const FilterItemShootSchema = t.Object({
  type: t.Literal('shoot'),
  id: t.String(),
});

export const FilterItemFilenameSchema = t.Object({
  type: t.Literal('filename'),
  value: t.String(),
});

export const FilterItemCaptionSchema = t.Object({
  type: t.Literal('caption'),
  value: t.String(),
});

export const FilterItemPostedSchema = t.Object({
  type: t.Literal('posted'),
  value: t.Boolean(),
});

export const FilterItemCreatedDateStartSchema = t.Object({
  type: t.Literal('createdDateStart'),
  value: t.Date(),
});

export const FilterItemCreatedDateEndSchema = t.Object({
  type: t.Literal('createdDateEnd'),
  value: t.Date(),
});

export const FilterItemMediaTypeSchema = t.Object({
  type: t.Literal('mediaType'),
  value: t.Union([t.Literal('image'), t.Literal('video')]),
});

export const FilterItemDimensionEmptySchema = t.Object({
  type: t.Literal('dimensionEmpty'),
  dimensionId: t.Number(),
});

export const FilterItemSchema = t.Union([
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

export const FilterGroupSchema = t.Object({
  include: t.Boolean(),
  items: t.Array(FilterItemSchema),
});

export const MediaFilterSchema = t.Array(FilterGroupSchema);