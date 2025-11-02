import type { PostToRedditPayload } from "@fanslib/types";
import { Elysia, t } from "elysia";
import { db } from "~/lib/db";
import { isRedditAutomationRunning } from "./operations/automation/check-status";
import { postToReddit } from "./operations/automation/post-to-reddit";
import { generateRandomPost } from "./operations/generation/generate-random-post";
import { checkLoginStatus, generatePosts, getScheduledPosts, loginToReddit, regenerateMedia, scheduleAllPosts } from "./reddit-poster";

export const redditAutomationRoutes = new Elysia({ prefix: "/reddit-automation" })
  .get(
    "/is-running",
    async () => {
      const isRunning = isRedditAutomationRunning();
      return { isRunning };
    },
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
      detail: {
        summary: "Check Reddit login status",
        tags: ["Reddit Poster"],
      },
    }
  );




