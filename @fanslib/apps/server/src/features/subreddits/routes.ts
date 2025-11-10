import { Elysia } from "elysia";
import { CreateSubredditRequestBodySchema, CreateSubredditResponseSchema, createSubreddit } from "./operations/subreddit/create";
import { DeleteSubredditParamsSchema, DeleteSubredditResponseSchema, deleteSubreddit } from "./operations/subreddit/delete";
import { FetchAllSubredditsResponseSchema, fetchAllSubreddits } from "./operations/subreddit/fetch-all";
import { FetchSubredditByIdRequestParamsSchema, FetchSubredditByIdResponseSchema, fetchSubredditById } from "./operations/subreddit/fetch-by-id";
import { FetchLastPostDatesRequestBodySchema, FetchLastPostDatesResponseSchema, fetchLastPostDatesForSubreddits } from "./operations/subreddit/fetch-last-post-dates";
import { UpdateSubredditRequestBodySchema, UpdateSubredditRequestParamsSchema, UpdateSubredditResponseSchema, updateSubreddit } from "./operations/subreddit/update";

export const subredditsRoutes = new Elysia({ prefix: "/api/subreddits" })
  .get("/", () => fetchAllSubreddits(), {
    response: FetchAllSubredditsResponseSchema,
  })
  .get("/:id", ({ params }) => fetchSubredditById(params), {
    params: FetchSubredditByIdRequestParamsSchema,
    response: FetchSubredditByIdResponseSchema,
  })
  .post("/", async ({ body }) =>
    createSubreddit(body)
  , {
    body: CreateSubredditRequestBodySchema,
    response: CreateSubredditResponseSchema,
  })
  .patch("/:id", ({ params, body }) => updateSubreddit(params, body), {
    params: UpdateSubredditRequestParamsSchema,
    body: UpdateSubredditRequestBodySchema,
    response: UpdateSubredditResponseSchema,
  })
  .delete("/:id", ({ params }) => deleteSubreddit(params), {
    params: DeleteSubredditParamsSchema,
    response: DeleteSubredditResponseSchema,
  })
  .post("/last-post-dates", ({ body }) => fetchLastPostDatesForSubreddits(body), {
    body: FetchLastPostDatesRequestBodySchema,
    response: FetchLastPostDatesResponseSchema,
  });

