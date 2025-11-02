import type { CreateSubredditRequest, FetchLastPostDatesForSubredditsRequest, UpdateSubredditRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { createSubreddit } from "./operations/subreddit/create";
import { deleteSubreddit } from "./operations/subreddit/delete";
import { fetchAllSubreddits } from "./operations/subreddit/fetch-all";
import { fetchSubredditById } from "./operations/subreddit/fetch-by-id";
import { fetchLastPostDatesForSubreddits } from "./operations/subreddit/fetch-last-post-dates";
import { updateSubreddit } from "./operations/subreddit/update";

export const subredditsRoutes = new Elysia({ prefix: "/api/subreddits" })
  .get("/", async () => fetchAllSubreddits())
  .get("/:id", async ({ params: { id } }) => {
    const subreddit = await fetchSubredditById(id);
    if (!subreddit) {
      return { error: "Subreddit not found" };
    }
    return subreddit;
  })
  .post("/", async ({ body }) =>
    createSubreddit(body as CreateSubredditRequest)
  )
  .patch("/:id", async ({ params: { id }, body }) => {
    const subreddit = await updateSubreddit(
      id,
      body as UpdateSubredditRequest
    );
    return subreddit;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteSubreddit(id);
    return { success: true };
  })
  .post("/last-post-dates", async ({ body }) => {
    const { subredditIds } =
      body as FetchLastPostDatesForSubredditsRequest;
    return fetchLastPostDatesForSubreddits(subredditIds);
  });

