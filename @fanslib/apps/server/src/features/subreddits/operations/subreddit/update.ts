import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";
import { Channel } from "../../../channels/entity";

export const UpdateSubredditRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateSubredditRequestBodySchema = SubredditSchema.omit({
  channelId: true,
  channel: true,
})
  .extend({
    name: z.string().optional(),
    eligibleMediaFilter: z.unknown().nullable().optional(),
  })
  .partial();

export const UpdateSubredditResponseSchema = SubredditSchema;

export const updateSubreddit = async (
  id: string,
  updates: z.infer<typeof UpdateSubredditRequestBodySchema>,
): Promise<Subreddit | null> => {
  const dataSource = await db();

  return await dataSource.transaction(async (manager) => {
    const subredditRepo = manager.getRepository(Subreddit);
    const channelRepo = manager.getRepository(Channel);

    const subreddit = await subredditRepo.findOne({ 
      where: { id },
      relations: ["channel"],
    });
    
    if (!subreddit) {
      return null;
    }

    Object.assign(subreddit, updates);
    await subredditRepo.save(subreddit);

    if (subreddit.channelId && subreddit.channel) {
      const channelUpdates: Partial<Channel> = {};
      
      if (updates.name !== undefined) {
        channelUpdates.name = updates.name;
      }
      if (updates.notes !== undefined) {
        channelUpdates.description = updates.notes;
      }
      if (updates.eligibleMediaFilter !== undefined) {
        channelUpdates.eligibleMediaFilter = updates.eligibleMediaFilter;
      }
      if (updates.maxPostFrequencyHours !== undefined) {
        channelUpdates.postCooldownHours = updates.maxPostFrequencyHours;
      }

      if (Object.keys(channelUpdates).length > 0) {
        Object.assign(subreddit.channel, channelUpdates);
        await channelRepo.save(subreddit.channel);
      }
    }

    return subreddit;
  });
};
