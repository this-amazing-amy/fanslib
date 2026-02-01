import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError } from "../../lib/hono-utils";
import { DraftBlueskyPostRequestBodySchema, draftBlueskyPost } from "./operations/bluesky/draft";
import { FindRedgifsURLRequestBodySchema, findRedgifsURL } from "./operations/redgifs/find-url";
import { RefreshRedgifsURLRequestBodySchema, refreshRedgifsURL } from "./operations/redgifs/refresh-url";
import { FindSubredditPostingTimesRequestBodySchema, findSubredditPostingTimes } from "./operations/subreddit/find-posting-times";

export const postponeRoutes = new Hono()
  .basePath("/api/postpone")
  .post("/draft-bluesky", zValidator("json", DraftBlueskyPostRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await draftBlueskyPost(body);
    return c.json(result);
  })
  .post("/find-redgifs-url", zValidator("json", FindRedgifsURLRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await findRedgifsURL(body);
    return c.json(result);
  })
  .post("/refresh-redgifs-url", zValidator("json", RefreshRedgifsURLRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await refreshRedgifsURL(body);
    return c.json(result);
  })
  .post("/find-subreddit-posting-times", zValidator("json", FindSubredditPostingTimesRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await findSubredditPostingTimes(body);
    return c.json(result);
  });



