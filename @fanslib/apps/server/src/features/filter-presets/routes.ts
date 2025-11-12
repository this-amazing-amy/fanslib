import { Elysia, t } from "elysia";
import { CreateFilterPresetRequestBodySchema, CreateFilterPresetResponseSchema, createFilterPreset } from "./operations/filter-preset/create";
import { DeleteFilterPresetRequestParamsSchema, DeleteFilterPresetResponseSchema, deleteFilterPreset } from "./operations/filter-preset/delete";
import { FetchAllFilterPresetsResponseSchema, fetchAllFilterPresets } from "./operations/filter-preset/fetch-all";
import { FetchFilterPresetByIdRequestParamsSchema, FetchFilterPresetByIdResponseSchema, fetchFilterPresetById } from "./operations/filter-preset/fetch-by-id";
import { UpdateFilterPresetRequestBodySchema, UpdateFilterPresetRequestParamsSchema, UpdateFilterPresetResponseSchema, updateFilterPreset } from "./operations/filter-preset/update";

export const filterPresetsRoutes = new Elysia({ prefix: "/api/filter-presets" })
  .get("/all", async () => fetchAllFilterPresets(), {
    response: FetchAllFilterPresetsResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const preset = await fetchFilterPresetById(id);
    if (!preset) {
      set.status = 404;
      return { error: "Filter preset not found" };
    }
    return preset;  
  }, {
    params: FetchFilterPresetByIdRequestParamsSchema,
    response: {
      200: FetchFilterPresetByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) => createFilterPreset(body), {
    body: CreateFilterPresetRequestBodySchema,
    response: CreateFilterPresetResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const preset = await updateFilterPreset(id, body);
    if (!preset) {
      set.status = 404;
      return { error: "Filter preset not found" };
    }
    return preset;
  }, {
    params: UpdateFilterPresetRequestParamsSchema,
    body: UpdateFilterPresetRequestBodySchema,
    response: {
      200: UpdateFilterPresetResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteFilterPreset(id);
    if (!success) {
      set.status = 404;
      return { error: "Filter preset not found" };
    }
    return { success: true };
  }, {
    params: DeleteFilterPresetRequestParamsSchema,
    response: {
      200: DeleteFilterPresetResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });

