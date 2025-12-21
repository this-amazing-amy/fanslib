import { t } from "elysia";

export const MediaTypeSchema = t.Union([t.Literal('image'), t.Literal('video')]);

export const MediaSchema = t.Object({
  id: t.String(),
  relativePath: t.String(),
  type: MediaTypeSchema,
  name: t.String(),
  size: t.Number(),
  duration: t.Nullable(t.Number()),
  redgifsUrl: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  fileCreationDate: t.Date(),
  fileModificationDate: t.Date(),
});

