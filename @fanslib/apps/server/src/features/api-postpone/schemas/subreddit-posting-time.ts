import { t } from "elysia";

export const SubredditPostingTimeSchema = t.Object({
  day: t.Number(),
  hour: t.Number(),
  posts: t.Number(),
  score: t.Number(),
});
