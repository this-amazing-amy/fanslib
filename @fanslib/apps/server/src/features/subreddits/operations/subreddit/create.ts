import { z } from "zod";
import { db } from "../../../../lib/db";
import {
  Subreddit,
  SubredditSchema,
  VERIFICATION_STATUS,
} from "../../entity";
import { Channel } from "../../../channels/entity";

export const CreateSubredditRequestBodySchema = SubredditSchema.omit({
  id: true,
  channelId: true,
  channel: true,
})
  .extend({
    name: z.string(),
    eligibleMediaFilter: z.unknown().nullable().optional(),
  })
  .partial()
  .required({ name: true });

export const CreateSubredditResponseSchema = SubredditSchema;

export const createSubreddit = async (
  data: z.infer<typeof CreateSubredditRequestBodySchema>,
): Promise<Subreddit> => {
  const dataSource = await db();

  return await dataSource.transaction(async (manager) => {
    const channelRepo = manager.getRepository(Channel);
    const subredditRepo = manager.getRepository(Subreddit);

    const channel = channelRepo.create({
      name: data.name,
      typeId: "reddit",
      description: data.notes ?? null,
      eligibleMediaFilter: data.eligibleMediaFilter ?? null,
      postCooldownHours: data.maxPostFrequencyHours ?? null,
      mediaRepostCooldownHours: 720,
    });
    await channelRepo.save(channel);

    const subreddit = subredditRepo.create({
      ...data,
      channelId: channel.id,
      verificationStatus: data.verificationStatus ?? VERIFICATION_STATUS.UNKNOWN,
    });
    await subredditRepo.save(subreddit);

    const savedSubreddit = await subredditRepo.findOne({
      where: { id: subreddit.id },
      relations: ["channel"],
    });

    if (!savedSubreddit) {
      throw new Error("Failed to retrieve saved subreddit");
    }

    return savedSubreddit;
  });
};
