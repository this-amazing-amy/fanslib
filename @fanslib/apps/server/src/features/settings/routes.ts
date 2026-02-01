import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { clearFanslyCredentials, ClearFanslyCredentialsResponseSchema } from "./operations/credentials/clear";
import { loadFanslyCredentials, LoadFanslyCredentialsResponseSchema } from "./operations/credentials/load";
import { saveFanslyCredentials, SaveFanslyCredentialsRequestBodySchema, SaveFanslyCredentialsResponseSchema } from "./operations/credentials/save";
import { loadSettings, LoadSettingsResponseSchema } from "./operations/setting/load";
import { saveSettings, SaveSettingsRequestBodySchema, SaveSettingsResponseSchema } from "./operations/setting/save";
import { toggleSfwMode, ToggleSfwModeResponseSchema } from "./operations/setting/toggle-sfw";
import { validationError } from "../../lib/hono-utils";

export const settingsRoutes = new Hono()
  .basePath("/api/settings")
  .get("/", async (c) => {
    const result = await loadSettings();
    return c.json(result);
  })
  .patch("/", zValidator("json", SaveSettingsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await saveSettings(body);
    return c.json(result);
  })
  .post("/toggle-sfw", async (c) => {
    const result = await toggleSfwMode();
    return c.json(result);
  })
  .get("/fansly-credentials", async (c) => {
    const result = await loadFanslyCredentials();
    return c.json(result);
  })
  .post("/fansly-credentials", zValidator("json", SaveFanslyCredentialsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await saveFanslyCredentials(body);
    return c.json(result);
  })
  .delete("/fansly-credentials", async (c) => {
    const result = await clearFanslyCredentials();
    return c.json(result);
  });
