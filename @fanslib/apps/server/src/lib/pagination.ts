import { t, type TSchema } from "elysia";

export const paginatedResponseSchema = (itemSchema: TSchema) => t.Object({
    items: t.Array(itemSchema),
    total: t.Numeric(),
    page: t.Numeric(),
    limit: t.Numeric(),
    totalPages: t.Numeric(),
})