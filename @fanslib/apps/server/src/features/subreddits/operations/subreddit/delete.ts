import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";
import { Channel } from "../../../channels/entity";

export const DeleteSubredditParamsSchema = z.object({
  id: z.string(),
});

export const DeleteSubredditResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteSubreddit = async (id: string): Promise<boolean> => {
  const dataSource = await db();

  return await dataSource.transaction(async (manager) => {
    const subredditRepo = manager.getRepository(Subreddit);
    const channelRepo = manager.getRepository(Channel);

    const subreddit = await subredditRepo.findOne({ 
      where: { id },
      relations: ["channel"],
    });
    
    if (!subreddit) {
      return false;
    }

    await subredditRepo.delete({ id });

    if (subreddit.channelId) {
      await channelRepo.delete({ id: subreddit.channelId });
    }

    return true;
  });
};
