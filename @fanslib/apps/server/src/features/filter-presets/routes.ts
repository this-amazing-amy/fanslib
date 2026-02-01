import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateFilterPresetRequestBodySchema, createFilterPreset } from "./operations/filter-preset/create";
import { deleteFilterPreset } from "./operations/filter-preset/delete";
import { fetchAllFilterPresets } from "./operations/filter-preset/fetch-all";
import { fetchFilterPresetById } from "./operations/filter-preset/fetch-by-id";
import { UpdateFilterPresetRequestBodySchema, updateFilterPreset } from "./operations/filter-preset/update";

export const filterPresetsRoutes = new Hono()
  .basePath("/api/filter-presets")
  .get("/all", async (c) => {
    const result = await fetchAllFilterPresets();
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const preset = await fetchFilterPresetById(id);
    if (!preset) {
      return notFound(c, "Filter preset not found");
    }
    return c.json(preset);  
  })
  .post("/", zValidator("json", CreateFilterPresetRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createFilterPreset(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateFilterPresetRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const preset = await updateFilterPreset(id, body);
    if (!preset) {
      return notFound(c, "Filter preset not found");
    }
    return c.json(preset);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteFilterPreset(id);
    if (!success) {
      return notFound(c, "Filter preset not found");
    }
    return c.json({ success: true });
  });

