import { z } from "zod";

export const MediaTypeSchema = z.enum(['image', 'video']);

export const MediaSchema = z.object({
  id: z.string(),
  relativePath: z.string(),
  type: MediaTypeSchema,
  name: z.string(),
  size: z.number(),
  duration: z.number().nullable(),
  redgifsUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  fileCreationDate: z.coerce.date(),
  fileModificationDate: z.coerce.date(),
});

