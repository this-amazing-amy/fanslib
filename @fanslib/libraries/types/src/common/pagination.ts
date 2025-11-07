import { Schema as S } from "effect";

export const PaginationParamsSchema = S.Struct({
  page: S.Number,
  limit: S.Number,
});

export const createPaginatedResponseSchema = <A, I>(itemSchema: S.Schema<A, I, never>) =>
  S.Struct({
    items: S.Array(itemSchema),
    total: S.Number,
    page: S.Number,
    limit: S.Number,
    totalPages: S.Number,
  });

export type PaginationParams = S.Schema.Type<typeof PaginationParamsSchema>;
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};