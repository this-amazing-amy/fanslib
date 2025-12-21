import { cors } from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import "reflect-metadata";
import { analyticsRoutes } from "./features/analytics/routes";
import { postponeRoutes } from "./features/api-postpone/routes";
import { channelsRoutes } from "./features/channels/routes";
import { contentSchedulesRoutes } from "./features/content-schedules/routes";
import { filterPresetsRoutes } from "./features/filter-presets/routes";
import { hashtagsRoutes } from "./features/hashtags/routes";
import { libraryRoutes } from "./features/library/routes";
import { postsRoutes } from "./features/posts/routes";
import { runScheduledPostsCronTick } from "./features/posts/scheduled-posts-cron";
import { redditAutomationRoutes } from "./features/reddit-automation/routes";
import { settingsRoutes } from "./features/settings/routes";
import { shootsRoutes } from "./features/shoots/routes";
import { snippetsRoutes } from "./features/snippets/routes";
import { subredditsRoutes } from "./features/subreddits/routes";
import { tagsRoutes } from "./features/tags/routes";
import { db } from "./lib/db";
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

const app = new Elysia()
.use(cors({
  origin: true, // Allow all origins (including chrome-extension://)
  credentials: true,
  exposeHeaders: ["X-Serialization", "Content-Type", "Content-Length"],
}))
  .use(
    isScheduledPostsCronEnabled
      ? cron({
        name: "scheduled-posts-cron",
        pattern: "* * * * *",
        run: () => runScheduledPostsCronTick(),
      })
      : new Elysia()
  )
  .use(swagger({
    documentation: {
      info: {
        title: "FansLib API",
        version: "1.0.0",
      },
    },
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .post("/migrate-colors", async () => {
    try {
      const result = await migrateColorsToPresets();
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  })
  .use(libraryRoutes)
  .use(postsRoutes)
  .use(channelsRoutes)
  .use(subredditsRoutes)
  .use(tagsRoutes)
  .use(hashtagsRoutes)
  .use(shootsRoutes)
  .use(contentSchedulesRoutes)
  .use(filterPresetsRoutes)
  .use(snippetsRoutes)
  .use(settingsRoutes)
  .use(postponeRoutes)
  .use(analyticsRoutes)
  .use(redditAutomationRoutes)
  .listen(6970);

db()
  .then(async () => {
    await seedDatabase();
    await logStartupEnvironment();
    if (isScheduledPostsCronEnabled) {
      await runScheduledPostsCronTick();
    }
    console.log(`🚀 Server running at http://localhost:${app.server?.port}`);
    console.log(`📊 Database initialized`);
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

// Export app type for Eden Treaty
export type App = typeof app;
