import { db } from "../../../../lib/db";

/**
 * Get media IDs that were posted to a specific channel within the cooldown period
 * @param channelId - The channel ID to check
 * @param cooldownHours - Number of hours to look back
 * @returns Set of media IDs that are within the cooldown period
 */
export const getRecentlyPostedMediaIds = async (
  channelId: string,
  cooldownHours: number,
): Promise<Set<string>> => {
  if (cooldownHours <= 0) {
    return new Set();
  }

  const database = await db();
  
  // Calculate the cutoff timestamp
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - cooldownHours);

  // Query for media IDs posted to this channel within cooldown period
  const results = await database.manager
    .createQueryBuilder()
    .select("DISTINCT pm.mediaId", "mediaId")
    .from("post_media", "pm")
    .innerJoin("post", "p", "p.id = pm.postId")
    .where("p.channelId = :channelId", { channelId })
    .andWhere("p.scheduledFor >= :cutoffDate", { cutoffDate: cutoffDate.toISOString() })
    .getRawMany<{ mediaId: string }>();

  return new Set(results.map((r) => r.mediaId));
};
