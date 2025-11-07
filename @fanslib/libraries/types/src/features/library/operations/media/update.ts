import { Schema as S } from "effect";
import { MediaSchema, type Media } from "../../media";

export const UpdateMediaRequestSchema = S.partial(
  S.Struct({
    relativePath: S.String,
    type: S.Literal("image", "video"),
    name: S.String,
    size: S.Number,
    duration: S.optional(S.Number),
    redgifsUrl: S.optional(S.String),
    fileCreationDate: S.Date,
    fileModificationDate: S.Date,
  })
);

export const UpdateMediaResponseSchema = S.NullOr(MediaSchema);
export const UpdateMediaResponseStdSchema = S.standardSchemaV1(UpdateMediaResponseSchema);

export type UpdateMediaRequest = S.Schema.Type<typeof UpdateMediaRequestSchema>;
export type UpdateMediaResponse = Media | null;
