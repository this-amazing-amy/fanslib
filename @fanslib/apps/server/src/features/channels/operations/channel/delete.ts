import { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel } from "../../entity";
import { Subreddit } from "../../../subreddits/entity";
import { Post } from "../../../posts/entity";
import { ContentSchedule, ScheduleChannel } from "../../../content-schedules/entity";
import { CaptionSnippet } from "../../../snippets/entity";

export const DeleteChannelRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteChannelResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteChannel = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);
  const channel = await repository.findOne({ where: { id } });
  if (!channel) {
    return false;
  }

  // Use a transaction to ensure all deletions happen atomically
  await dataSource.transaction(async (manager) => {
    const subredditRepo = manager.getRepository(Subreddit);
    const postRepo = manager.getRepository(Post);
    
    // Find subreddit if it exists
    const subreddit = await subredditRepo.findOne({ where: { channelId: id } });
    
    // If subreddit exists, nullify subredditId on all posts before deleting subreddit
    if (subreddit) {
      await postRepo.update(
        { subredditId: subreddit.id },
        { subredditId: null }
      );
      await subredditRepo.delete({ id: subreddit.id });
    }

    // Delete snippets for this channel
    const snippetRepo = manager.getRepository(CaptionSnippet);
    await snippetRepo.delete({ channelId: id });

    // Delete schedule channels
    const scheduleChannelRepo = manager.getRepository(ScheduleChannel);
    await scheduleChannelRepo.delete({ channelId: id });

    // Delete posts for this channel
    await postRepo.delete({ channelId: id });

    // Delete content schedules (legacy single-channel schedules)
    const scheduleRepo = manager.getRepository(ContentSchedule);
    await scheduleRepo.delete({ channelId: id });

    // Finally delete the channel itself
    await manager.delete(Channel, { id });
  });

  return true;
};
