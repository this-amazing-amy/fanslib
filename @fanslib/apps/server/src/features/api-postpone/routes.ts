import { Elysia } from "elysia";
import { DraftBlueskyPostRequestBodySchema, DraftBlueskyPostResponseSchema, draftBlueskyPost } from "./operations/bluesky/draft";
import { FindRedgifsURLRequestBodySchema, FindRedgifsURLResponseSchema, findRedgifsURL } from "./operations/redgifs/find-url";
import { RefreshRedgifsURLRequestBodySchema, RefreshRedgifsURLResponseSchema, refreshRedgifsURL } from "./operations/redgifs/refresh-url";
import { FindSubredditPostingTimesRequestBodySchema, FindSubredditPostingTimesResponseSchema, findSubredditPostingTimes } from "./operations/subreddit/find-posting-times";

export const postponeRoutes = new Elysia({ prefix: "/api/postpone" })
  .post("/draft-bluesky", async ({ body }) => draftBlueskyPost(body), {
    body: DraftBlueskyPostRequestBodySchema,
    response: DraftBlueskyPostResponseSchema,
  })
  .post("/find-redgifs-url", async ({ body }) => findRedgifsURL(body), {
    body: FindRedgifsURLRequestBodySchema,
    response: FindRedgifsURLResponseSchema,
  })
  .post("/refresh-redgifs-url", async ({ body }) => refreshRedgifsURL(body), {
    body: RefreshRedgifsURLRequestBodySchema,
    response: RefreshRedgifsURLResponseSchema,
  })
  .post("/find-subreddit-posting-times", async ({ body }) => findSubredditPostingTimes(body), {
    body: FindSubredditPostingTimesRequestBodySchema,
    response: FindSubredditPostingTimesResponseSchema,
  });



