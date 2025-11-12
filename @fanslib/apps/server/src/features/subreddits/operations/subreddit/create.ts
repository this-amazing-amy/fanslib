import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema, VERIFICATION_STATUS } from "../../entity";

export const CreateSubredditRequestBodySchema = t.Intersect([
  t.Required(t.Pick(t.Omit(SubredditSchema, ["id"]), ["name"])),
  t.Partial(t.Omit(SubredditSchema, ["id", "name"])),
]);

export const CreateSubredditResponseSchema = SubredditSchema;

export const createSubreddit = async (
  data: typeof CreateSubredditRequestBodySchema.static
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
