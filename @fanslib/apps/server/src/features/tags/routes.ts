import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { notFound, validationError } from "../../lib/hono-utils";
import { queryStringNumberArray } from "../../lib/query-helpers";
import * as driftPrevention from "./drift-prevention";
import { assignTagsToMedia } from "./operations/media-tag/assign";
import { bulkAssignTags } from "./operations/media-tag/bulk-assign";
import { fetchMediaTags } from "./operations/media-tag/fetch";
import { removeTagsFromMedia } from "./operations/media-tag/remove";
import { createTagDefinition } from "./operations/tag-definition/create";
import { deleteTagDefinition } from "./operations/tag-definition/delete";
import { fetchTagsByDimension } from "./operations/tag-definition/fetch-by-dimension";
import { fetchTagDefinitionById } from "./operations/tag-definition/fetch-by-id";
import { fetchTagDefinitionsByIds } from "./operations/tag-definition/fetch-by-ids";
import { updateTagDefinition } from "./operations/tag-definition/update";
import { createTagDimension } from "./operations/tag-dimension/create";
import { deleteTagDimension } from "./operations/tag-dimension/delete";
import { fetchAllTagDimensions } from "./operations/tag-dimension/fetch-all";
import { fetchTagDimensionById } from "./operations/tag-dimension/fetch-by-id";
import { updateTagDimension } from "./operations/tag-dimension/update";

// Zod schemas for validation
const StickerDisplayModeSchema = z.enum(["none", "color", "short"]);
const DataTypeSchema = z.enum(["categorical", "numerical", "boolean"]);
const TagSourceSchema = z.enum(["manual", "automated", "imported"]);

// Tag Dimension schemas
const TagDimensionIdParamSchema = z.object({
  id: z.string(),
});

const CreateTagDimensionBodySchema = z.object({
  name: z.string(),
  dataType: DataTypeSchema,
  description: z.string().nullable().optional(),
  validationSchema: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  stickerDisplay: StickerDisplayModeSchema.optional(),
  isExclusive: z.boolean().optional(),
});

const UpdateTagDimensionBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  validationSchema: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  stickerDisplay: StickerDisplayModeSchema.optional(),
  isExclusive: z.boolean().optional(),
});

// Tag Definition schemas
const TagDefinitionIdParamSchema = z.object({
  id: z.string(),
});

const FetchTagsByDimensionQuerySchema = z.object({
  dimensionId: z.coerce.number().optional(),
  dimensionName: z.string().optional(),
});

const FetchTagDefinitionsByIdsQuerySchema = z.object({
  ids: queryStringNumberArray,
});

const CreateTagDefinitionBodySchema = z.object({
  dimensionId: z.number(),
  value: z.string(),
  displayName: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  shortRepresentation: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  parentTagId: z.number().nullable().optional(),
});

const UpdateTagDefinitionBodySchema = z.object({
  value: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  shortRepresentation: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  parentTagId: z.number().nullable().optional(),
});

// Media Tag schemas
const MediaIdParamSchema = z.object({
  mediaId: z.string(),
});

const FetchMediaTagsQuerySchema = z.object({
  dimensionId: z.string().optional(),
});

const AssignTagsToMediaBodySchema = z.object({
  mediaId: z.string(),
  tagDefinitionIds: z.array(z.number()),
  source: TagSourceSchema,
  confidence: z.number().optional(),
});

const BulkAssignTagsBodySchema = z.array(
  z.object({
    mediaId: z.string(),
    tagDefinitionIds: z.array(z.number()),
    source: TagSourceSchema,
    confidence: z.number().optional(),
  })
);

const RemoveTagsFromMediaBodySchema = z.object({
  tagIds: z.array(z.number()),
});

export const tagsRoutes = new Hono()
  .basePath("/api/tags")
  // Tag Dimensions - 5 endpoints
  .get("/dimensions", async (c) => {
    const result = await fetchAllTagDimensions();
    return c.json(result);
  })
  .get(
    "/dimensions/by-id/:id",
    zValidator("param", TagDimensionIdParamSchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const dimension = await fetchTagDimensionById(parseInt(id));
      if (!dimension) {
        return notFound(c, "Tag dimension not found");
      }
      return c.json(dimension);
    }
  )
  .post(
    "/dimensions",
    zValidator("json", CreateTagDimensionBodySchema, validationError),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createTagDimension(body);
      return c.json(result);
    }
  )
  .patch(
    "/dimensions/by-id/:id",
    zValidator("param", TagDimensionIdParamSchema, validationError),
    zValidator("json", UpdateTagDimensionBodySchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dimension = await updateTagDimension(parseInt(id), body);
      if (!dimension) {
        return notFound(c, "Tag dimension not found");
      }
      return c.json(dimension);
    }
  )
  .delete(
    "/dimensions/by-id/:id",
    zValidator("param", TagDimensionIdParamSchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const success = await deleteTagDimension(parseInt(id));
      if (!success) {
        return notFound(c, "Tag dimension not found");
      }
      return c.json({ success: true });
    }
  )
  // Tag Definitions - 6 endpoints
  .get(
    "/definitions",
    zValidator("query", FetchTagsByDimensionQuerySchema, validationError),
    async (c) => {
      const query = c.req.valid("query");
      const result = await fetchTagsByDimension(query);
      return c.json(result);
    }
  )
  .get(
    "/definitions/by-ids",
    zValidator("query", FetchTagDefinitionsByIdsQuerySchema, validationError),
    async (c) => {
      const query = c.req.valid("query");
      const result = await fetchTagDefinitionsByIds(query);
      return c.json(result);
    }
  )
  .get(
    "/definitions/by-id/:id",
    zValidator("param", TagDefinitionIdParamSchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const tag = await fetchTagDefinitionById(parseInt(id));
      if (!tag) {
        return notFound(c, "Tag definition not found");
      }
      return c.json(tag);
    }
  )
  .post(
    "/definitions",
    zValidator("json", CreateTagDefinitionBodySchema, validationError),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createTagDefinition(body);
      return c.json(result);
    }
  )
  .patch(
    "/definitions/by-id/:id",
    zValidator("param", TagDefinitionIdParamSchema, validationError),
    zValidator("json", UpdateTagDefinitionBodySchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const tag = await updateTagDefinition(parseInt(id), body);
      if (!tag) {
        return notFound(c, "Tag definition not found");
      }
      return c.json(tag);
    }
  )
  .delete(
    "/definitions/by-id/:id",
    zValidator("param", TagDefinitionIdParamSchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const success = await deleteTagDefinition(parseInt(id));
      if (!success) {
        return notFound(c, "Tag definition not found");
      }
      return c.json({ success: true });
    }
  )
  // Media Tags - 4 endpoints
  .get(
    "/media/by-media-id/:mediaId",
    zValidator("param", MediaIdParamSchema, validationError),
    zValidator("query", FetchMediaTagsQuerySchema, validationError),
    async (c) => {
      const { mediaId } = c.req.valid("param");
      const query = c.req.valid("query");
      const result = await fetchMediaTags({ mediaId }, query);
      return c.json(result);
    }
  )
  .post(
    "/media/assign",
    zValidator("json", AssignTagsToMediaBodySchema, validationError),
    async (c) => {
      const body = c.req.valid("json");
      const result = await assignTagsToMedia(body);
      return c.json(result);
    }
  )
  .post(
    "/media/assign-bulk",
    zValidator("json", BulkAssignTagsBodySchema, validationError),
    async (c) => {
      const body = c.req.valid("json");
      const result = await bulkAssignTags(body);
      return c.json(result);
    }
  )
  .delete(
    "/media/by-media-id/:mediaId",
    zValidator("param", MediaIdParamSchema, validationError),
    zValidator("json", RemoveTagsFromMediaBodySchema, validationError),
    async (c) => {
      const { mediaId } = c.req.valid("param");
      const body = c.req.valid("json");
      const result = await removeTagsFromMedia({ mediaId }, body);
      return c.json(result);
    }
  )
  // Drift Prevention - 3 endpoints
  .get("/drift-prevention/stats", async (c) => {
    const result = await driftPrevention.getDriftPreventionStats();
    return c.json(result);
  })
  .post("/drift-prevention/cleanup", async (c) => {
    const result = await driftPrevention.performPeriodicCleanup();
    return c.json(result);
  })
  .post("/drift-prevention/sync-sticker-display", async (c) => {
    const result = await driftPrevention.syncStickerDisplayProperties();
    return c.json(result);
  });

