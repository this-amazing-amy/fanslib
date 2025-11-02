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
import { settingsRoutes } from "./features/settings/routes";
import { shootsRoutes } from "./features/shoots/routes";
import { snippetsRoutes } from "./features/snippets/routes";
import { subredditsRoutes } from "./features/subreddits/routes";
import { tagsRoutes } from "./features/tags/routes";
import { db } from "./lib/db";
import { serializeJson } from "./lib/serialize-json";

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: "FansLib API",
        version: "1.0.0",
      },
    },
  }))
  .onError(({ error, set }) => {
    const statusCode = "status" in error && typeof error.status === "number" ? error.status : 500;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the full error for debugging
    if (statusCode === 500) {
      console.error("❌ Internal Server Error:", error);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }

    set.status = statusCode;
    return { error: errorMessage };
  })
  .mapResponse(serializeJson)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
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
  // .use(redditAutomationRoutes)
  .listen(process.env.PORT ?? 8001);

db().then(() => {
  console.log(`🚀 Server running at http://localhost:${app.server?.port}`);
  console.log(`📊 Database initialized`);
}).catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
