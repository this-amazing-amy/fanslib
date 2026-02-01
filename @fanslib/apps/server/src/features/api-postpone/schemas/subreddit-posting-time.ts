import { z } from "zod";

export const SubredditPostingTimeSchema = z.object({
  day: z.number(),
  hour: z.number(),
  posts: z.number(),
  score: z.number(),
});
