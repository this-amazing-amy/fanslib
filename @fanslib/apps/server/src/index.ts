import { cors } from "@elysiajs/cors";
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
import { redditAutomationRoutes } from "./features/reddit-automation/routes";
import { settingsRoutes } from "./features/settings/routes";
import { shootsRoutes } from "./features/shoots/routes";
import { snippetsRoutes } from "./features/snippets/routes";
import { subredditsRoutes } from "./features/subreddits/routes";
import { tagsRoutes } from "./features/tags/routes";
import { db } from "./lib/db";
import { seedDatabase } from "./lib/seed";
import { migrateColorsToPresets } from "./lib/migrate-colors-to-presets";


const app = new Elysia()
.use(cors({


  exposeHeaders: ["X-Serialization", "Content-Type", "Content-Length"],
}))
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
    console.log(`🚀 Server running at http://localhost:${app.server?.port}`);
    console.log(`📊 Database initialized`);
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

// Export app type for Eden Treaty
export type App = typeof app;
