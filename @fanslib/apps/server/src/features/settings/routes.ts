import type { ImportDatabaseRequest, PerformHealthCheckRequest, SaveFanslyCredentialsRequest, SaveSettingsRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { clearFanslyCredentials } from "./operations/credentials/clear";
import { loadFanslyCredentials } from "./operations/credentials/load";
import { saveFanslyCredentials } from "./operations/credentials/save";
import { importDatabase } from "./operations/database/import";
import { resetDatabase } from "./operations/database/reset";
import { validateImportedDatabase } from "./operations/database/validate";
import { performHealthCheck } from "./operations/health-check/perform";
import { loadSettings } from "./operations/setting/load";
import { saveSettings } from "./operations/setting/save";
import { toggleSfwMode } from "./operations/setting/toggle-sfw";

export const settingsRoutes = new Elysia({ prefix: "/api/settings" })
  .get("/", async () => loadSettings())
  .patch("/", async ({ body }) => saveSettings(body as SaveSettingsRequest))
  .post("/toggle-sfw", async () => toggleSfwMode())
  .post("/reset-database", async () => {
    await resetDatabase();
    return { success: true };
  })
  .get("/fansly-credentials", async () => loadFanslyCredentials())
  .post("/fansly-credentials", async ({ body }) => {
    await saveFanslyCredentials(body as SaveFanslyCredentialsRequest);
    return { success: true };
  })
  .delete("/fansly-credentials", async () => {
    await clearFanslyCredentials();
    return { success: true };
  })
  .post("/import-database", async ({ body }) => {
    const request = body as ImportDatabaseRequest;
    return importDatabase(request.sourcePath);
  })
  .post("/validate-database", async () => validateImportedDatabase())
  .post("/health-check", async ({ body }) => {
    const request = body as PerformHealthCheckRequest;
    return performHealthCheck(request.serverUrl);
  });



