import type { FindRedgifsURLRequest, FindSubredditPostingTimesRequest, DraftBlueskyPostRequest, RefreshRedgifsURLRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { draftBlueskyPost } from "./operations/bluesky/draft";
import { findRedgifsURL } from "./operations/redgifs/find-url";
import { refreshRedgifsURL } from "./operations/redgifs/refresh-url";
import { findSubredditPostingTimes } from "./operations/subreddit/find-posting-times";

export const postponeRoutes = new Elysia({ prefix: "/api/postpone" })
  .post("/draft-bluesky", async ({ body }) => draftBlueskyPost(body as DraftBlueskyPostRequest))
  .post("/find-redgifs-url", async ({ body }) => findRedgifsURL(body as FindRedgifsURLRequest))
  .post("/refresh-redgifs-url", async ({ body }) => refreshRedgifsURL(body as RefreshRedgifsURLRequest))
  .post("/find-subreddit-posting-times", async ({ body }) => findSubredditPostingTimes(body as FindSubredditPostingTimesRequest));



