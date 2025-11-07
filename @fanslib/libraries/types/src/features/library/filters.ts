import { Schema as S } from "effect";

export const FilterItemSchema = S.Union(
  S.Struct({
    type: S.Literal("channel", "subreddit", "tag", "shoot"),
    id: S.String,
  }),
  S.Struct({
    type: S.Literal("filename", "caption"),
    value: S.String,
  }),
  S.Struct({
    type: S.Literal("posted"),
    value: S.Boolean,
  }),
  S.Struct({
    type: S.Literal("createdDateStart", "createdDateEnd"),
    value: S.Date,
  }),
  S.Struct({
    type: S.Literal("mediaType"),
    value: S.Literal("image", "video"),
  }),
  S.Struct({
    type: S.Literal("dimensionEmpty"),
    dimensionId: S.Number,
  })
);

export const FilterGroupSchema = S.Struct({
  include: S.Boolean,
  items: S.Array(FilterItemSchema),
});

export const MediaFiltersSchema = S.Array(FilterGroupSchema);

export type FilterItem = S.Schema.Type<typeof FilterItemSchema>;
export type FilterGroup = S.Schema.Type<typeof FilterGroupSchema>;
export type MediaFilters = S.Schema.Type<typeof MediaFiltersSchema>;
