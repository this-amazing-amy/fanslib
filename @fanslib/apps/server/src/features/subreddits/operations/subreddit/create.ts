import { VERIFICATION_STATUS, type CreateSubredditRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const createSubreddit = async (
  data: CreateSubredditRequest
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

