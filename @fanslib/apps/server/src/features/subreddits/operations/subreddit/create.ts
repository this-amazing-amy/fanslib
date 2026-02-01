import type { z } from "zod";
import { db } from "../../../../lib/db";
import {
  Subreddit,
  SubredditSchema,
  VERIFICATION_STATUS,
} from "../../entity";

export const CreateSubredditRequestBodySchema = SubredditSchema.omit({
  id: true,
}).required({ name: true }).partial();

export const CreateSubredditResponseSchema = SubredditSchema;

export const createSubreddit = async (
  data: z.infer<typeof CreateSubredditRequestBodySchema>,
): Promise<Subreddit> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = repository.create({
    ...data,
    verificationStatus: data.verificationStatus ?? VERIFICATION_STATUS.UNKNOWN,
  });

  await repository.save(subreddit);
  return subreddit;
};
