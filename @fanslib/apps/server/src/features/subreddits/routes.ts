import { Elysia, t } from "elysia";
import { CreateSubredditRequestBodySchema, CreateSubredditResponseSchema, createSubreddit } from "./operations/subreddit/create";
import { DeleteSubredditParamsSchema, DeleteSubredditResponseSchema, deleteSubreddit } from "./operations/subreddit/delete";
import { FetchAllSubredditsResponseSchema, fetchAllSubreddits } from "./operations/subreddit/fetch-all";
import { FetchSubredditByIdRequestParamsSchema, FetchSubredditByIdResponseSchema, fetchSubredditById } from "./operations/subreddit/fetch-by-id";
import { FetchLastPostDatesRequestBodySchema, FetchLastPostDatesResponseSchema, fetchLastPostDatesForSubreddits } from "./operations/subreddit/fetch-last-post-dates";
import { UpdateSubredditRequestBodySchema, UpdateSubredditRequestParamsSchema, UpdateSubredditResponseSchema, updateSubreddit } from "./operations/subreddit/update";

export const subredditsRoutes = new Elysia({ prefix: "/api/subreddits" })
  .get("/all", fetchAllSubreddits, {
    response: FetchAllSubredditsResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const subreddit = await fetchSubredditById(id);
    if (!subreddit) {
      set.status = 404;
      return { error: "Subreddit not found" };
    }
    return subreddit;
  }, {
    params: FetchSubredditByIdRequestParamsSchema,
    response: {
      200: FetchSubredditByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) =>
    createSubreddit(body)
  , {
    body: CreateSubredditRequestBodySchema,
    response: CreateSubredditResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const subreddit = await updateSubreddit(id, body);
    if (!subreddit) {
      set.status = 404;
      return { error: "Subreddit not found" };
    }
    return subreddit;
  }, {
    params: UpdateSubredditRequestParamsSchema,
    body: UpdateSubredditRequestBodySchema,
    response: {
      200: UpdateSubredditResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteSubreddit(id);
    if (!success) {
      set.status = 404;
      return { error: "Subreddit not found" };
    }
    return { success: true };
  }, {
    params: DeleteSubredditParamsSchema,
    response: {
      200: DeleteSubredditResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/last-post-dates", ({ body }) => fetchLastPostDatesForSubreddits(body), {
    body: FetchLastPostDatesRequestBodySchema,
    response: FetchLastPostDatesResponseSchema,
  });

