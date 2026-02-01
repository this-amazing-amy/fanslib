import { Hono } from "hono";
import { cors } from "hono/cors";
import "reflect-metadata";
import { blueskyRoutes } from "./features/api-bluesky/routes";
import { postponeRoutes } from "./features/api-postpone/routes";
import { channelsRoutes } from "./features/channels/routes";
import { contentSchedulesRoutes } from "./features/content-schedules/routes";
import { filterPresetsRoutes } from "./features/filter-presets/routes";
import { hashtagsRoutes } from "./features/hashtags/routes";
import { libraryRoutes } from "./features/library/routes";
import { pipelineRoutes } from "./features/pipeline/routes";
import { postsRoutes } from "./features/posts/routes";
import { runScheduledPostsCronTick } from "./features/posts/scheduled-posts-cron";
import { settingsRoutes } from "./features/settings/routes";
import { shootsRoutes } from "./features/shoots/routes";
import { snippetsRoutes } from "./features/snippets/routes";
import { subredditsRoutes } from "./features/subreddits/routes";
import { db } from "./lib/db";
import { devalueMiddleware } from "./lib/devalue-middleware";
import { env } from "./lib/env";
import { migrateColorsToPresets } from "./lib/migrate-colors-to-presets";
import { seedDatabase } from "./lib/seed";
import { walkDirectory } from "./lib/walkDirectory";

const logStartupEnvironment = async (): Promise<void> => {
  const { appdataPath, libraryPath, ffprobePath } = env();

  console.log("Environment configuration", {
    APPDATA_PATH: appdataPath,
    LIBRARY_PATH: libraryPath,
    FFPROBE_PATH: ffprobePath ?? null,
  });

  try {
    const files: string[] = [];
    // eslint-disable-next-line functional/no-loop-statements
    for await (const filePath of walkDirectory(libraryPath)) {
      if (!filePath) continue;
      files.push(filePath);
    }

    console.log("Library contents at startup", {
      libraryPath,
      totalFiles: files.length,
    });
  } catch (error) {
    console.error("Failed to inspect library contents at startup", error);
  }
};

const isCronDisabled = process.env.DISABLE_CRON === "true";
const isTestEnvironment = process.env.NODE_ENV === "test";
const isScheduledPostsCronEnabled = !isCronDisabled && !isTestEnvironment;

const app = new Hono()
  .use(
    "*",
    cors({
      origin: "*", // Allow all origins (including chrome-extension://)
      credentials: true,
      exposeHeaders: ["X-Serialization", "Content-Type", "Content-Length"],
    }),
  )
  .use("*", devalueMiddleware())
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date() }))
  .post("/migrate-colors", async (c) => {
    try {
      const result = await migrateColorsToPresets();
      return c.json({ success: true, ...result });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
  .route("/", settingsRoutes)
  .route("/", blueskyRoutes)
  .route("/", postponeRoutes)
  .route("/", hashtagsRoutes)
  .route("/", shootsRoutes)
  .route("/", filterPresetsRoutes)
  .route("/", snippetsRoutes)
  .route("/", subredditsRoutes)
  .route("/", channelsRoutes)
  .route("/", contentSchedulesRoutes)
  .route("/", libraryRoutes)
  .route("/", pipelineRoutes)
  .route("/", postsRoutes);

// Set up cron job if enabled
if (isScheduledPostsCronEnabled) {
  setInterval(
    () => {
      runScheduledPostsCronTick().catch((error) => {
        console.error("Scheduled posts cron tick failed:", error);
      });
    },
    60 * 1000,
  ); // Run every minute
}

// Start server
const port = 6970;
Bun.serve({
  fetch: app.fetch,
  port,
});

db()
  .then(async () => {
    await seedDatabase();
    await logStartupEnvironment();
    if (isScheduledPostsCronEnabled) {
      await runScheduledPostsCronTick();
    }
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📊 Database initialized`);
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

// Export app type for Hono client type inference
export type AppType = typeof app;
