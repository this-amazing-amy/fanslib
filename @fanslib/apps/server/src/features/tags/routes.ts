import { Elysia } from "elysia";
import * as driftPrevention from "./drift-prevention";
import { AssignTagsToMediaRequestBodySchema, AssignTagsToMediaResponseSchema, assignTagsToMedia } from "./operations/media-tag/assign";
import { BulkAssignTagsRequestBodySchema, BulkAssignTagsResponseSchema, bulkAssignTags } from "./operations/media-tag/bulk-assign";
import { GetMediaTagsParamsSchema, GetMediaTagsQuerySchema, GetMediaTagsResponseSchema, getMediaTags } from "./operations/media-tag/fetch";
import { RemoveTagsFromMediaParamsSchema, RemoveTagsFromMediaRequestBodySchema, RemoveTagsFromMediaResponseSchema, removeTagsFromMedia } from "./operations/media-tag/remove";
import { CreateTagDefinitionRequestBodySchema, CreateTagDefinitionResponseSchema, createTagDefinition } from "./operations/tag-definition/create";
import { DeleteTagDefinitionParamsSchema, DeleteTagDefinitionResponseSchema, deleteTagDefinition } from "./operations/tag-definition/delete";
import { GetTagsByDimensionQuerySchema, GetTagsByDimensionResponseSchema, getTagsByDimension } from "./operations/tag-definition/fetch-by-dimension";
import { GetTagDefinitionByIdParamsSchema, GetTagDefinitionByIdResponseSchema, getTagDefinitionById } from "./operations/tag-definition/fetch-by-id";
import { GetTagDefinitionsByIdsQuerySchema, GetTagDefinitionsByIdsResponseSchema, getTagDefinitionsByIds } from "./operations/tag-definition/fetch-by-ids";
import { UpdateTagDefinitionParamsSchema, UpdateTagDefinitionRequestBodySchema, UpdateTagDefinitionResponseSchema, updateTagDefinition } from "./operations/tag-definition/update";
import { CreateTagDimensionRequestBodySchema, CreateTagDimensionResponseSchema, createTagDimension } from "./operations/tag-dimension/create";
import { DeleteTagDimensionParamsSchema, DeleteTagDimensionResponseSchema, deleteTagDimension } from "./operations/tag-dimension/delete";
import { GetAllTagDimensionsResponseSchema, getAllTagDimensions } from "./operations/tag-dimension/fetch-all";
import { GetTagDimensionByIdParamsSchema, GetTagDimensionByIdResponseSchema, getTagDimensionById } from "./operations/tag-dimension/fetch-by-id";
import { UpdateTagDimensionParamsSchema, UpdateTagDimensionRequestBodySchema, UpdateTagDimensionResponseSchema, updateTagDimension } from "./operations/tag-dimension/update";

export const tagsRoutes = new Elysia({ prefix: "/api/tags" })
  .get("/dimensions", () => getAllTagDimensions(), {
    response: GetAllTagDimensionsResponseSchema,
  })
  .get("/dimensions/:id", ({ params }) => getTagDimensionById(params), {
    params: GetTagDimensionByIdParamsSchema,
    response: GetTagDimensionByIdResponseSchema,
  })
  .post("/dimensions", ({ body }) => createTagDimension(body), {
    body: CreateTagDimensionRequestBodySchema,
    response: CreateTagDimensionResponseSchema,
  })
  .patch("/dimensions/:id", ({ params, body }) => updateTagDimension(params, body), {
    params: UpdateTagDimensionParamsSchema,
    body: UpdateTagDimensionRequestBodySchema,
    response: UpdateTagDimensionResponseSchema,
  })
  .delete("/dimensions/:id", ({ params }) => deleteTagDimension(params), {
    params: DeleteTagDimensionParamsSchema,
    response: DeleteTagDimensionResponseSchema,
  })
  .get("/definitions", ({ query }) => getTagsByDimension(query), {
    query: GetTagsByDimensionQuerySchema,
    response: GetTagsByDimensionResponseSchema,
  })
  .get("/definitions/:id", ({ params }) => getTagDefinitionById(params), {
    params: GetTagDefinitionByIdParamsSchema,
    response: GetTagDefinitionByIdResponseSchema,
  })
  .post("/definitions", async ({ body }) => createTagDefinition(body), {
    body: CreateTagDefinitionRequestBodySchema,
    response: CreateTagDefinitionResponseSchema,
  })
  .patch("/definitions/:id", ({ params, body }) => updateTagDefinition(params, body), {
    params: UpdateTagDefinitionParamsSchema,
    body: UpdateTagDefinitionRequestBodySchema,
    response: UpdateTagDefinitionResponseSchema,
  })
  .delete("/definitions/:id", ({ params }) => deleteTagDefinition(params), {
    params: DeleteTagDefinitionParamsSchema,
    response: DeleteTagDefinitionResponseSchema,
  })
  .get("/definitions/by-ids", ({ query }) => getTagDefinitionsByIds(query), {
    query: GetTagDefinitionsByIdsQuerySchema,
    response: GetTagDefinitionsByIdsResponseSchema,
  })
  .get("/media/:mediaId", ({ params, query }) => getMediaTags(params, query), {
    params: GetMediaTagsParamsSchema,
    query: GetMediaTagsQuerySchema,
    response: GetMediaTagsResponseSchema,
  })
  .post("/media/assign", ({ body }) => assignTagsToMedia(body), {
    body: AssignTagsToMediaRequestBodySchema,
    response: AssignTagsToMediaResponseSchema,
  })
  .post("/media/assign-bulk", ({ body }) => bulkAssignTags(body), {
    body: BulkAssignTagsRequestBodySchema,
    response: BulkAssignTagsResponseSchema,
  })
  .delete("/media/:mediaId", ({ params, body }) => removeTagsFromMedia(params, body), {
    params: RemoveTagsFromMediaParamsSchema,
    body: RemoveTagsFromMediaRequestBodySchema,
    response: RemoveTagsFromMediaResponseSchema,
  })
  .get("/drift-prevention/stats", () => driftPrevention.getDriftPreventionStats())
  .post("/drift-prevention/cleanup", () => driftPrevention.performPeriodicCleanup())
  .post("/drift-prevention/sync-sticker-display", () =>
    driftPrevention.syncStickerDisplayProperties()
  );

