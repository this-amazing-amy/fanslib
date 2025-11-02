import type { CreateFilterPresetRequest, UpdateFilterPresetRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { createFilterPreset } from "./operations/filter-preset/create";
import { deleteFilterPreset } from "./operations/filter-preset/delete";
import { getAllFilterPresets } from "./operations/filter-preset/fetch-all";
import { getFilterPresetById } from "./operations/filter-preset/fetch-by-id";
import { updateFilterPreset } from "./operations/filter-preset/update";

export const filterPresetsRoutes = new Elysia({ prefix: "/api/filter-presets" })
  .get("/", async () => getAllFilterPresets())
  .get("/:id", async ({ params: { id } }) => {
    const preset = await getFilterPresetById(id);
    if (!preset) {
      return { error: "Filter preset not found" };
    }
    return preset;
  })
  .post("/", async ({ body }) => createFilterPreset(body as CreateFilterPresetRequest))
  .patch("/:id", async ({ params: { id }, body }) => {
    const request = body as UpdateFilterPresetRequest;
    const preset = await updateFilterPreset(id, request);
    if (!preset) {
      return { error: "Filter preset not found" };
    }
    return preset;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteFilterPreset(id);
    return { success: true };
  });

