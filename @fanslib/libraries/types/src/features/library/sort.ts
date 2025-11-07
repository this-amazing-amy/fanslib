import { Schema as S } from "effect";

export const SortFieldSchema = S.Literal(
  "fileModificationDate",
  "fileCreationDate",
  "lastPosted",
  "random"
);

export const SortDirectionSchema = S.Literal("ASC", "DESC");

export const MediaSortSchema = S.Struct({
  field: SortFieldSchema,
  direction: SortDirectionSchema,
});

export type SortField = S.Schema.Type<typeof SortFieldSchema>;
export type SortDirection = S.Schema.Type<typeof SortDirectionSchema>;
export type MediaSort = S.Schema.Type<typeof MediaSortSchema>;
