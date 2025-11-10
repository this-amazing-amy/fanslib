import { VERIFICATION_STATUS } from "@fanslib/types";
import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const CreateSubredditRequestBodySchema = t.Omit(SubredditSchema, ["id"]);

export const CreateSubredditResponseSchema = SubredditSchema;

export const createSubreddit = async (
  data: typeof CreateSubredditRequestBodySchema.static
): Promise<Subreddit> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = repository.create({
    name: data.name,
    maxPostFrequencyHours: data.maxPostFrequencyHours,
    memberCount: data.memberCount,
    notes: data.notes,
    verificationStatus: data.verificationStatus ?? VERIFICATION_STATUS.UNKNOWN,
    eligibleMediaFilter: data.eligibleMediaFilter,
    defaultFlair: data.defaultFlair,
    captionPrefix: data.captionPrefix,
  });

  await repository.save(subreddit);
  return subreddit;
};
