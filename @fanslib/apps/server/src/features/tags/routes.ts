import { Elysia, t } from "elysia";
import * as driftPrevention from "./drift-prevention";
import { AssignTagsToMediaRequestBodySchema, AssignTagsToMediaResponseSchema, assignTagsToMedia } from "./operations/media-tag/assign";
import { BulkAssignTagsRequestBodySchema, BulkAssignTagsResponseSchema, bulkAssignTags } from "./operations/media-tag/bulk-assign";
import { FetchMediaTagsRequestParamsSchema, FetchMediaTagsRequestQuerySchema, FetchMediaTagsResponseSchema, fetchMediaTags } from "./operations/media-tag/fetch";
import { RemoveTagsFromMediaParamsSchema, RemoveTagsFromMediaRequestBodySchema, RemoveTagsFromMediaResponseSchema, removeTagsFromMedia } from "./operations/media-tag/remove";
import { CreateTagDefinitionRequestBodySchema, CreateTagDefinitionResponseSchema, createTagDefinition } from "./operations/tag-definition/create";
import { DeleteTagDefinitionParamsSchema, DeleteTagDefinitionResponseSchema, deleteTagDefinition } from "./operations/tag-definition/delete";
import { GetTagsByDimensionQuerySchema, GetTagsByDimensionResponseSchema, fetchTagsByDimension } from "./operations/tag-definition/fetch-by-dimension";
import { FetchTagDefinitionByIdRequestParamsSchema, FetchTagDefinitionByIdResponseSchema, fetchTagDefinitionById } from "./operations/tag-definition/fetch-by-id";
import { FetchTagDefinitionsByIdsRequestQuerySchema, FetchTagDefinitionsByIdsResponseSchema, fetchTagDefinitionsByIds } from "./operations/tag-definition/fetch-by-ids";
import { UpdateTagDefinitionParamsSchema, UpdateTagDefinitionRequestBodySchema, UpdateTagDefinitionResponseSchema, updateTagDefinition } from "./operations/tag-definition/update";
import { CreateTagDimensionRequestBodySchema, CreateTagDimensionResponseSchema, createTagDimension } from "./operations/tag-dimension/create";
import { DeleteTagDimensionParamsSchema, DeleteTagDimensionResponseSchema, deleteTagDimension } from "./operations/tag-dimension/delete";
import { GetAllTagDimensionsResponseSchema, fetchAllTagDimensions } from "./operations/tag-dimension/fetch-all";
import { FetchTagDimensionByIdRequestParamsSchema, FetchTagDimensionByIdResponseSchema, fetchTagDimensionById } from "./operations/tag-dimension/fetch-by-id";
import { UpdateTagDimensionParamsSchema, UpdateTagDimensionRequestBodySchema, UpdateTagDimensionResponseSchema, updateTagDimension } from "./operations/tag-dimension/update";

export const tagsRoutes = new Elysia({ prefix: "/api/tags" })
  .get("/dimensions", () => fetchAllTagDimensions(), {
    response: GetAllTagDimensionsResponseSchema,
  })
  .get("/dimensions/by-id/:id", async ({ params: { id }, set }) => {
    const dimension = await fetchTagDimensionById(parseInt(id));
    if (!dimension) {
      set.status = 404;
      return { error: "Tag dimension not found" };
    }
    return dimension;
  }, {
    params: FetchTagDimensionByIdRequestParamsSchema,
    response: {
      200: FetchTagDimensionByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/dimensions", ({ body }) => createTagDimension(body), {
    body: CreateTagDimensionRequestBodySchema,
    response: CreateTagDimensionResponseSchema,
  })
  .patch("/dimensions/by-id/:id", async ({ params: { id }, body, set }) => {
    const dimension = await updateTagDimension(parseInt(id), body);
    if (!dimension) {
      set.status = 404;
      return { error: "Tag dimension not found" };
    }
    return dimension;
  }, {
    params: UpdateTagDimensionParamsSchema,
    body: UpdateTagDimensionRequestBodySchema,
    response: {
      200: UpdateTagDimensionResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/dimensions/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteTagDimension(parseInt(id));
    if (!success) {
      set.status = 404;
      return { error: "Tag dimension not found" };
    }
    return { success: true };
  }, {
    params: DeleteTagDimensionParamsSchema,
    response: {
      200: DeleteTagDimensionResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .get("/definitions", ({ query }) => fetchTagsByDimension(query), {
    query: GetTagsByDimensionQuerySchema,
    response: GetTagsByDimensionResponseSchema,
  })
  .get("/definitions/by-ids", ({ query }) => fetchTagDefinitionsByIds(query), {
    query: FetchTagDefinitionsByIdsRequestQuerySchema,
    response: FetchTagDefinitionsByIdsResponseSchema,
  })
  .get("/definitions/by-id/:id", async ({ params: { id }, set }) => {
    const tag = await fetchTagDefinitionById(parseInt(id));
    if (!tag) {
      set.status = 404;
      return { error: "Tag definition not found" };
    }
    return tag;
  }, {
    params: FetchTagDefinitionByIdRequestParamsSchema,
    response: {
      200: FetchTagDefinitionByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/definitions", async ({ body }) => createTagDefinition(body), {
    body: CreateTagDefinitionRequestBodySchema,
    response: CreateTagDefinitionResponseSchema,
  })
  .patch("/definitions/by-id/:id", async ({ params: { id }, body, set }) => {
    const tag = await updateTagDefinition(parseInt(id), body);
    if (!tag) {
      set.status = 404;
      return { error: "Tag definition not found" };
    }
    return tag;
  }, {
    params: UpdateTagDefinitionParamsSchema,
    body: UpdateTagDefinitionRequestBodySchema,
    response: {
      200: UpdateTagDefinitionResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/definitions/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteTagDefinition(parseInt(id));
    if (!success) {
      set.status = 404;
      return { error: "Tag definition not found" };
    }
    return { success: true };
  }, {
    params: DeleteTagDefinitionParamsSchema,
    response: {
      200: DeleteTagDefinitionResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .get("/media/by-media-id/:mediaId", async ({ params: { mediaId }, query }) => fetchMediaTags({ mediaId }, query), {
    params: FetchMediaTagsRequestParamsSchema,
    query: FetchMediaTagsRequestQuerySchema,
    response: FetchMediaTagsResponseSchema,
  })
  .post("/media/assign", ({ body }) => assignTagsToMedia(body), {
    body: AssignTagsToMediaRequestBodySchema,
    response: AssignTagsToMediaResponseSchema,
  })
  .post("/media/assign-bulk", ({ body }) => bulkAssignTags(body), {
    body: BulkAssignTagsRequestBodySchema,
    response: BulkAssignTagsResponseSchema,
  })
  .delete("/media/by-media-id/:mediaId", async ({ params: { mediaId }, body }) => removeTagsFromMedia({ mediaId }, body), {
    params: RemoveTagsFromMediaParamsSchema,
    body: RemoveTagsFromMediaRequestBodySchema,
    response: RemoveTagsFromMediaResponseSchema,
  })
  .get("/drift-prevention/stats", () => driftPrevention.getDriftPreventionStats())
  .post("/drift-prevention/cleanup", () => driftPrevention.performPeriodicCleanup())
  .post("/drift-prevention/sync-sticker-display", () =>
    driftPrevention.syncStickerDisplayProperties()
  );

