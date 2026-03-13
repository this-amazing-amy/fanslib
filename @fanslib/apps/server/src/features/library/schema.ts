import { z } from "zod";
import { RepostStatusValueSchema } from "./schemas/media-filter";

export const MediaTypeSchema = z.enum(['image', 'video']);

export const MediaSchema = z.object({
  id: z.string(),
  relativePath: z.string(),
  type: MediaTypeSchema,
  name: z.string(),
  size: z.number(),
  duration: z.number().nullable(),
  redgifsUrl: z.string().nullable(),
  description: z.string().nullable(),
  excluded: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  fileCreationDate: z.coerce.date(),
  fileModificationDate: z.coerce.date(),
  repostStatus: RepostStatusValueSchema.optional(),
});

