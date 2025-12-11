import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { browserDataPath } from "../../lib/env";
import { createFileSessionStorage } from "../../lib/reddit-poster/session-storage";
import { isRedditAutomationRunning } from "./operations/automation/check-status";
import { postToReddit } from "./operations/automation/post-to-reddit";
import { generateRandomPost } from "./operations/generation/generate-random-post";
import { checkLoginStatus, generatePosts, getScheduledPosts, loginToReddit, regenerateMedia, scheduleAllPosts } from "./reddit-poster";

type PostToRedditPayload = {
  subredditId: string;
  mediaId: string;
  caption: string;
};

export const redditAutomationRoutes = new Elysia({ prefix: "/api/reddit-automation" })
  .get(
    "/is-running",
    async () => {
      const isRunning = isRedditAutomationRunning();
      return { isRunning };
    },
    {
      response: t.Object({ isRunning: t.Boolean() }),
    }
  )
  .post(
    "/generate-random-post",
    async ({ body }) => {
      const post = await generateRandomPost(body.subreddits, body.channelId);
      return post;
    },
    {
      body: t.Object({
        subreddits: t.Array(t.Any()),
        channelId: t.String(),
      }),
      response: t.Any(),
      detail: {
        summary: "Generate a random Reddit post",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/generate-posts",
    async ({ body }) => {
      const database = await db();
      const posts = await generatePosts(database, body.count, body.subreddits, body.channelId);
      return posts;
    },
    {
      body: t.Object({
        count: t.Number(),
        subreddits: t.Array(t.Any()),
        channelId: t.String(),
      }),
      response: t.Array(t.Any()),
      detail: {
        summary: "Generate multiple Reddit posts",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/regenerate-media",
    async ({ body }) => {
      const result = await regenerateMedia(body.subredditId, body.channelId);
      return result;
    },
    {
      body: t.Object({
        subredditId: t.String(),
        channelId: t.String(),
      }),
      response: t.Any(),
      detail: {
        summary: "Regenerate media for a subreddit",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/schedule-posts",
    async ({ body }) => {
      const database = await db();
      const postIds = await scheduleAllPosts(database, body.posts);
      return postIds;
    },
    {
      body: t.Object({
        posts: t.Array(t.Any()),
      }),
      response: t.Array(t.String()),
      detail: {
        summary: "Schedule Reddit posts",
        tags: ["Reddit Poster"],
      },
    }
  )
  .get(
    "/scheduled-posts",
    async () => {
      const database = await db();
      const posts = await getScheduledPosts(database);
      return posts;
    },
    {
      response: t.Array(t.Any()),
      detail: {
        summary: "Get scheduled Reddit posts",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/post-to-reddit",
    async ({ body }) => {
      const request = body as PostToRedditPayload;
      return postToReddit(request.subredditId, request.mediaId, request.caption);
    },
    {
      response: t.Object({
        success: t.Boolean(),
        url: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/login",
    async ({ body }) => {
      const result = await loginToReddit(body.userId);
      return { success: result };
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
      }),
      response: t.Object({ success: t.Boolean() }),
      detail: {
        summary: "Login to Reddit",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/check-login",
    async ({ body }) => {
      const result = await checkLoginStatus(body.userId);
      return result;
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
      }),
      response: t.Object({
        isLoggedIn: t.Boolean(),
        username: t.Optional(t.String()),
      }),
      detail: {
        summary: "Check Reddit login status",
        tags: ["Reddit Poster"],
      },
    }
  )
  .post(
    "/session/status",
    async ({ body }) => {
      const sessionStorage = createFileSessionStorage(browserDataPath(), body.userId);
      const hasSession = await sessionStorage.exists();
      
      if (!hasSession) {
        return {
          hasSession: false,
          isValid: false,
        };
      }

      // For now, we'll just check if the session file exists
      // In the future, we could validate the session by checking expiry, etc.
      return {
        hasSession: true,
        isValid: true,
      };
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
      }),
      response: t.Object({
        hasSession: t.Boolean(),
        isValid: t.Boolean(),
      }),
      detail: {
        summary: "Get Reddit session status",
        tags: ["Reddit Poster"],
      },
    }
  )
  .delete(
    "/session",
    async ({ body }) => {
      const sessionStorage = createFileSessionStorage(browserDataPath(), body.userId);
      await sessionStorage.clear();
      return { success: true };
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
      }),
      response: t.Object({
        success: t.Boolean(),
      }),
      detail: {
        summary: "Clear Reddit session",
        tags: ["Reddit Poster"],
      },
    }
  );




