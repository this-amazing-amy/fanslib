import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateSubredditRequestBodySchema, createSubreddit } from "./operations/subreddit/create";
import { deleteSubreddit } from "./operations/subreddit/delete";
import { fetchAllSubreddits } from "./operations/subreddit/fetch-all";
import { fetchSubredditById } from "./operations/subreddit/fetch-by-id";
import { FetchLastPostDatesRequestBodySchema, fetchLastPostDatesForSubreddits } from "./operations/subreddit/fetch-last-post-dates";
import { UpdateSubredditRequestBodySchema, updateSubreddit } from "./operations/subreddit/update";

export const subredditsRoutes = new Hono()
  .basePath("/api/subreddits")
  .get("/all", async (c) => {
    const result = await fetchAllSubreddits();
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const subreddit = await fetchSubredditById(id);
    if (!subreddit) {
      return notFound(c, "Subreddit not found");
    }
    return c.json(subreddit);
  })
  .post("/", zValidator("json", CreateSubredditRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createSubreddit(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateSubredditRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const subreddit = await updateSubreddit(id, body);
    if (!subreddit) {
      return notFound(c, "Subreddit not found");
    }
    return c.json(subreddit);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteSubreddit(id);
    if (!success) {
      return notFound(c, "Subreddit not found");
    }
    return c.json({ success: true });
  })
  .post("/last-post-dates", zValidator("json", FetchLastPostDatesRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await fetchLastPostDatesForSubreddits(body);
    return c.json(result);
  });

