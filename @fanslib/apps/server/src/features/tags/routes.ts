import type { CreateTagDimensionRequest, UpdateTagDimensionRequest, CreateTagDefinitionRequest, UpdateTagDefinitionRequest, AssignTagsToMediaRequest, BulkAssignTagsRequest, RemoveTagsFromMediaRequest, FetchTagDefinitionsByIdsRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import * as driftPrevention from "./drift-prevention";
import { assignTagsToMedia } from "./operations/media-tag/assign";
import { bulkAssignTags } from "./operations/media-tag/bulk-assign";
import { getMediaTags } from "./operations/media-tag/fetch";
import { removeTagsFromMedia } from "./operations/media-tag/remove";
import { createTagDefinition } from "./operations/tag-definition/create";
import { deleteTagDefinition } from "./operations/tag-definition/delete";
import { getTagsByDimension } from "./operations/tag-definition/fetch-by-dimension";
import { getTagDefinitionById } from "./operations/tag-definition/fetch-by-id";
import { getTagDefinitionsByIds } from "./operations/tag-definition/fetch-by-ids";
import { updateTagDefinition } from "./operations/tag-definition/update";
import { createTagDimension } from "./operations/tag-dimension/create";
import { deleteTagDimension } from "./operations/tag-dimension/delete";
import { getAllTagDimensions } from "./operations/tag-dimension/fetch-all";
import { getTagDimensionById } from "./operations/tag-dimension/fetch-by-id";
import { updateTagDimension } from "./operations/tag-dimension/update";

export const tagsRoutes = new Elysia({ prefix: "/api/tags" })
  .get("/dimensions", async () => getAllTagDimensions())
  .get("/dimensions/:id", async ({ params: { id } }) => {
    const dimension = await getTagDimensionById(parseInt(id));
    return dimension;
  })
  .post("/dimensions", async ({ body }) => createTagDimension(body as CreateTagDimensionRequest))
  .patch("/dimensions/:id", async ({ params: { id }, body }) =>
    updateTagDimension(parseInt(id), body as UpdateTagDimensionRequest)
  )
  .delete("/dimensions/:id", async ({ params: { id } }) => {
    await deleteTagDimension(parseInt(id));
    return { success: true };
  })
  .get("/definitions", async ({ query }) => {
    const dimensionId = query.dimensionId ? parseInt(query.dimensionId as string) : undefined;
    if (dimensionId) {
      return getTagsByDimension(dimensionId);
    }
    return [];
  })
  .get("/definitions/:id", async ({ params: { id } }) => getTagDefinitionById(parseInt(id)))
  .post("/definitions", async ({ body }) => createTagDefinition(body as CreateTagDefinitionRequest))
  .patch("/definitions/:id", async ({ params: { id }, body }) =>
    updateTagDefinition(parseInt(id), body as UpdateTagDefinitionRequest)
  )
  .delete("/definitions/:id", async ({ params: { id } }) => {
    await deleteTagDefinition(parseInt(id));
    return { success: true };
  })
  .get("/definitions/by-ids", async ({ query }) => {
    const request: FetchTagDefinitionsByIdsRequest = {
      ids: query.ids ? JSON.parse(query.ids as string) : [],
    };
    return getTagDefinitionsByIds(request.ids);
  })
  .get("/media/:mediaId", async ({ params: { mediaId }, query }) => {
    const dimensionId = query.dimensionId ? parseInt(query.dimensionId as string) : undefined;
    return getMediaTags(mediaId, dimensionId);
  })
  .post("/media/assign", async ({ body }) => assignTagsToMedia(body as AssignTagsToMediaRequest))
  .post("/media/assign-bulk", async ({ body }) => {
    const request = body as BulkAssignTagsRequest;
    return bulkAssignTags(request);
  })
  .delete("/media/:mediaId", async ({ params: { mediaId }, body }) => {
    const request = body as RemoveTagsFromMediaRequest;
    await removeTagsFromMedia(mediaId, request.tagIds);
    return { success: true };
  })
  .get("/drift-prevention/stats", async () => driftPrevention.getDriftPreventionStats())
  .post("/drift-prevention/cleanup", async () => driftPrevention.performPeriodicCleanup())
  .post("/drift-prevention/sync-sticker-display", async () =>
    driftPrevention.syncStickerDisplayProperties()
  );

