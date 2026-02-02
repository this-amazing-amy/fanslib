import { z } from "zod";

export const SortFieldSchema = z.enum([
  'fileModificationDate',
  'fileCreationDate',
  'lastPosted',
  'leastPosted',
  'random',
]);

export const SortDirectionSchema = z.enum(['ASC', 'DESC']);

export const MediaSortSchema = z.object({
  field: SortFieldSchema,
  direction: SortDirectionSchema,
});