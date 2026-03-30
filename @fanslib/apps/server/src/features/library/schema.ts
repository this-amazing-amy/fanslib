import { z } from "zod";
import { ContentRatingSchema } from "./content-rating";
import { RepostStatusValueSchema } from "./schemas/media-filter";

export const MediaTypeSchema = z.enum(["image", "video"]);

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
  contentRating: ContentRatingSchema.nullable().default(null),
  package: z.string().nullable().default(null),
  role: z.string().nullable().default(null),
  isManaged: z.boolean().default(false),
  derivedFromId: z.string().nullable().default(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  fileCreationDate: z.coerce.date(),
  fileModificationDate: z.coerce.date(),
  repostStatus: RepostStatusValueSchema.optional(),
});
