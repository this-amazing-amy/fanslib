import { Elysia } from "elysia";
import { CreateFilterPresetRequestBodySchema, CreateFilterPresetResponseSchema, createFilterPreset } from "./operations/filter-preset/create";
import { DeleteFilterPresetResponseSchema, deleteFilterPreset } from "./operations/filter-preset/delete";
import { GetAllFilterPresetsResponseSchema, getAllFilterPresets } from "./operations/filter-preset/fetch-all";
import { GetFilterPresetByIdResponseSchema, getFilterPresetById } from "./operations/filter-preset/fetch-by-id";
import { UpdateFilterPresetRequestBodySchema, UpdateFilterPresetResponseSchema, updateFilterPreset } from "./operations/filter-preset/update";

export const filterPresetsRoutes = new Elysia({ prefix: "/api/filter-presets" })
  .get("/", async () => getAllFilterPresets(), {
    response: GetAllFilterPresetsResponseSchema,
  })
  .get("/:id", async ({ params: { id } }) => {
    const preset = await getFilterPresetById(id);
    if (!preset) {
      return { error: "Filter preset not found" };
    }
    return preset;
  }, {
    response: GetFilterPresetByIdResponseSchema,
  })
  .post("/", async ({ body }) => createFilterPreset(body), {
    body: CreateFilterPresetRequestBodySchema,
    response: CreateFilterPresetResponseSchema,
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const preset = await updateFilterPreset(id, body);
    if (!preset) {
      return { error: "Filter preset not found" };
    }
    return preset;
  }, {
    body: UpdateFilterPresetRequestBodySchema,
    response: UpdateFilterPresetResponseSchema,
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteFilterPreset(id);
    return { success: true };
  }, {
    response: DeleteFilterPresetResponseSchema,
  });

