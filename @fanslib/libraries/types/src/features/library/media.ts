import { Schema as S } from "effect";

export const MediaTypeSchema = S.Literal("image", "video");

export const MediaSchema = S.Struct({
  id: S.String,
  relativePath: S.String,
  type: MediaTypeSchema,
  name: S.String,
  size: S.Number,
  duration: S.optional(S.Number),
  redgifsUrl: S.optional(S.String),
  createdAt: S.Date,
  updatedAt: S.Date,
  fileCreationDate: S.Date,
  fileModificationDate: S.Date,
});

export const LibraryScanResultSchema = S.Struct({
  added: S.Number,
  updated: S.Number,
  removed: S.Number,
  total: S.Number,
});

export const LibraryScanProgressSchema = S.Struct({
  current: S.Number,
  total: S.Number,
});

export const FileScanResultSchema = S.Struct({
  action: S.Literal("added", "updated", "unchanged"),
  media: MediaSchema,
});

export const MediaStdSchema = S.standardSchemaV1(MediaSchema);

// Type inference helpers
export type Media = S.Schema.Type<typeof MediaSchema>;
export type MediaType = S.Schema.Type<typeof MediaTypeSchema>;
export type LibraryScanResult = S.Schema.Type<typeof LibraryScanResultSchema>;
export type LibraryScanProgress = S.Schema.Type<typeof LibraryScanProgressSchema>;
export type FileScanResult = S.Schema.Type<typeof FileScanResultSchema>;

export type MediaWithoutRelations = Omit<Media, "id">;