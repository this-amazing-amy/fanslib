import { Schema as S } from "effect";
import { createPaginatedResponseSchema, type PaginatedResponse } from "../../../../common/pagination";
import { MediaFiltersSchema } from "../../filters";
import { MediaSchema, type Media } from "../../media";
import { MediaSortSchema } from "../../sort";

export const FetchAllMediaRequestSchema = S.partial(
  S.Struct({
    page: S.Number,
    limit: S.Number,
    filters: MediaFiltersSchema,
    sort: MediaSortSchema,
  })
);

export const FetchAllMediaResponseSchema =  createPaginatedResponseSchema(MediaSchema);
export const FetchAllMediaResponseStdSchema = S.standardSchemaV1(FetchAllMediaResponseSchema);

export type FetchAllMediaRequest = S.Schema.Type<typeof FetchAllMediaRequestSchema>;
export type FetchAllMediaResponse = PaginatedResponse<Media>;
