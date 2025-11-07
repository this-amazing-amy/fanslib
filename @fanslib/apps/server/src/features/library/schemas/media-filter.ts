import { t } from "elysia";

const FilterItemSchema = t.Union([
  t.Object({
    type: t.Union([t.Literal('channel'), t.Literal('subreddit'), t.Literal('tag'), t.Literal('shoot')]),
    id: t.String(),
  }),
  t.Object({
    type: t.Union([t.Literal('filename'), t.Literal('caption')]),
    value: t.String(),
  }),
  t.Object({
    type: t.Literal('posted'),
    value: t.Boolean(),
  }),
  t.Object({
    type: t.Union([t.Literal('createdDateStart'), t.Literal('createdDateEnd')]),
    value: t.Date(),
  }),
  t.Object({
    type: t.Literal('mediaType'),
    value: t.Union([t.Literal('image'), t.Literal('video')]),
  }),
  t.Object({
    type: t.Literal('dimensionEmpty'),
    dimensionId: t.Number(),
  }),
]);

const FilterGroupSchema = t.Object({
  include: t.Boolean(),
  items: t.Array(FilterItemSchema),
});

export const MediaFilterSchema = t.Array(FilterGroupSchema);