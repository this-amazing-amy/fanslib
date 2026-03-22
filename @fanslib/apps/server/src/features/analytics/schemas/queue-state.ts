import { z } from "zod";

export const QueueItemSchema = z.object({
  postMediaId: z.string(),
  nextFetchAt: z.string(),
  caption: z.string().nullable(),
  thumbnailUrl: z.string(),
  overdue: z.boolean(),
});

export const QueueStateSchema = z.object({
  totalPending: z.number(),
  nextFetchAt: z.string().nullable(),
  items: z.array(QueueItemSchema),
});
