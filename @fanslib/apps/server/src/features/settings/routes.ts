import { Elysia } from "elysia";
import { clearFanslyCredentials, ClearFanslyCredentialsResponseSchema } from "./operations/credentials/clear";
import { loadFanslyCredentials } from "./operations/credentials/load";
import { saveFanslyCredentials, SaveFanslyCredentialsRequestBodySchema, SaveFanslyCredentialsResponseSchema } from "./operations/credentials/save";
import { loadSettings, LoadSettingsResponseSchema } from "./operations/setting/load";
import { saveSettings, SaveSettingsRequestBodySchema, SaveSettingsResponseSchema } from "./operations/setting/save";
import { toggleSfwMode, ToggleSfwModeResponseSchema } from "./operations/setting/toggle-sfw";

export const settingsRoutes = new Elysia({ prefix: "/api/settings" })
  .get("/", async () => loadSettings(), { response: LoadSettingsResponseSchema })
  .patch("/", async ({ body }) => saveSettings(body), { body: SaveSettingsRequestBodySchema, response: SaveSettingsResponseSchema })
  .post("/toggle-sfw", async () => toggleSfwMode(), { response: ToggleSfwModeResponseSchema })
  .get("/fansly-credentials", async () => loadFanslyCredentials())
  .post("/fansly-credentials", async ({ body }) => saveFanslyCredentials(body), { body: SaveFanslyCredentialsRequestBodySchema, response: SaveFanslyCredentialsResponseSchema })
  .delete("/fansly-credentials", async () => clearFanslyCredentials(), { response: ClearFanslyCredentialsResponseSchema })



