import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError } from "../../lib/hono-utils";
import { db } from "../../lib/db";
import { browserDataPath } from "../../lib/env";
import { createFileSessionStorage } from "../../lib/reddit-poster/session-storage";
import { isRedditAutomationRunning } from "./operations/automation/check-status";
import { postToReddit } from "./operations/automation/post-to-reddit";
import { generateRandomPost } from "./operations/generation/generate-random-post";
import { checkLoginStatus, generatePosts, getScheduledPosts, loginToReddit, regenerateMedia, scheduleAllPosts } from "./reddit-poster";
import {
  GenerateRandomPostRequestBodySchema,
  GeneratePostsRequestBodySchema,
  RegenerateMediaRequestBodySchema,
  SchedulePostsRequestBodySchema,
  PostToRedditRequestBodySchema,
  LoginRequestBodySchema,
  CheckLoginRequestBodySchema,
  SessionStatusRequestBodySchema,
  ClearSessionRequestBodySchema,
} from "./schema";

export const redditAutomationRoutes = new Hono()
  .basePath("/api/reddit-automation")
  .get("/is-running", async (c) => {
    const isRunning = isRedditAutomationRunning();
    return c.json({ isRunning });
  })
  .post("/generate-random-post", zValidator("json", GenerateRandomPostRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const post = await generateRandomPost(body.subreddits, body.channelId);
    return c.json(post);
  })
  .post("/generate-posts", zValidator("json", GeneratePostsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const database = await db();
    const posts = await generatePosts(database, body.count, body.subreddits, body.channelId);
    return c.json(posts);
  })
  .post("/regenerate-media", zValidator("json", RegenerateMediaRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await regenerateMedia(body.subredditId, body.channelId);
    return c.json(result);
  })
  .post("/schedule-posts", zValidator("json", SchedulePostsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const database = await db();
    const postIds = await scheduleAllPosts(database, body.posts);
    return c.json(postIds);
  })
  .get("/scheduled-posts", async (c) => {
    const database = await db();
    const posts = await getScheduledPosts(database);
    return c.json(posts);
  })
  .post("/post-to-reddit", zValidator("json", PostToRedditRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await postToReddit(body.subredditId, body.mediaId, body.caption);
    return c.json(result);
  })
  .post("/login", zValidator("json", LoginRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await loginToReddit(body.userId);
    return c.json({ success: result });
  })
  .post("/check-login", zValidator("json", CheckLoginRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await checkLoginStatus(body.userId);
    return c.json(result);
  })
  .post("/session/status", zValidator("json", SessionStatusRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const sessionStorage = createFileSessionStorage(browserDataPath(), body.userId);
    const hasSession = await sessionStorage.exists();
    
    if (!hasSession) {
      return c.json({
        hasSession: false,
        isValid: false,
      });
    }

    // For now, we'll just check if the session file exists
    // In the future, we could validate the session by checking expiry, etc.
    return c.json({
      hasSession: true,
      isValid: true,
    });
  })
  .delete("/session", zValidator("json", ClearSessionRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const sessionStorage = createFileSessionStorage(browserDataPath(), body.userId);
    await sessionStorage.clear();
    return c.json({ success: true });
  });




