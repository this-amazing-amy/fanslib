import type { SelectQueryBuilder } from "typeorm";
import type { Media } from "./entity";
import type { FilterItem, FilterContext } from "./filter-types";

type RepostStatusItem = Extract<FilterItem, { type: "repostStatus" }>;

export const buildRepostStatusFilter = (
  item: RepostStatusItem,
  queryBuilder: SelectQueryBuilder<Media>,
  paramIndex: number,
  include: boolean,
  context?: FilterContext,
): void => {
  const operator = include ? "" : "NOT ";

  const cooldownHours =
    context?.channelCooldownHours ??
    context?.repostSettings?.defaultMediaRepostCooldownHours ??
    504;
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - cooldownHours);
  const cutoffIso = cutoffDate.toISOString();

  const channelCondition = item.channelId ? `AND p.channelId = :rsChannelId${paramIndex}` : "";
  const channelParams = item.channelId ? { [`rsChannelId${paramIndex}`]: item.channelId } : {};

  // Subreddit-specific cooldown — uses the same channel cooldown window.
  // Each subreddit maps to its own channel row, so channelCooldownHours
  // already reflects the per-subreddit mediaRepostCooldownHours.
  const subredditOnCooldownSql = item.subredditId
    ? `EXISTS (
            SELECT 1 FROM post_media pm_sub
            JOIN post p_sub ON p_sub.id = pm_sub.postId
            WHERE pm_sub.mediaId = media.id
            AND p_sub.subredditId = :rsSubredditId${paramIndex}
            ${item.channelId ? `AND p_sub.channelId = :rsSubChannelId${paramIndex}` : ""}
            AND p_sub.date >= :rsSubCutoff${paramIndex}
          )`
    : "";
  const subredditParams = item.subredditId
    ? {
        [`rsSubredditId${paramIndex}`]: item.subredditId,
        ...(item.channelId ? { [`rsSubChannelId${paramIndex}`]: item.channelId } : {}),
        [`rsSubCutoff${paramIndex}`]: cutoffIso,
      }
    : {};

  switch (item.value) {
    case "never_posted":
      queryBuilder.andWhere(
        `${operator}(NOT EXISTS (
              SELECT 1 FROM post_media pm
              JOIN post p ON p.id = pm.postId
              WHERE pm.mediaId = media.id
              ${channelCondition}
              AND p.status = 'posted'
            ) AND media.excluded != 1)`,
        channelParams,
      );
      break;

    case "on_cooldown": {
      // On cooldown if within channel cooldown OR within subreddit cooldown
      const channelOnCooldown = `EXISTS (
              SELECT 1 FROM post_media pm
              JOIN post p ON p.id = pm.postId
              WHERE pm.mediaId = media.id
              ${channelCondition}
              AND p.status = 'posted'
              AND p.date >= :rsCutoff${paramIndex}
            )`;

      if (subredditOnCooldownSql) {
        queryBuilder.andWhere(`${operator}(${channelOnCooldown} OR ${subredditOnCooldownSql})`, {
          ...channelParams,
          [`rsCutoff${paramIndex}`]: cutoffIso,
          ...subredditParams,
        });
      } else {
        queryBuilder.andWhere(`${operator}${channelOnCooldown}`, {
          ...channelParams,
          [`rsCutoff${paramIndex}`]: cutoffIso,
        });
      }
      break;
    }

    case "repostable": {
      // Has been posted AND all posts outside cooldown AND not on subreddit cooldown
      const channelCooldownExpired = `NOT EXISTS (
                SELECT 1 FROM post_media pm2
                JOIN post p2 ON p2.id = pm2.postId
                WHERE pm2.mediaId = media.id
                ${channelCondition.replace(/p\./g, "p2.").replace(/rsChannelId/g, "rsChannelId2_")}
                AND p2.status = 'posted'
                AND p2.date >= :rsCutoff${paramIndex}
              )`;

      const subredditNotOnCooldown = subredditOnCooldownSql
        ? `AND NOT ${subredditOnCooldownSql}`
        : "";

      queryBuilder.andWhere(
        `${operator}(
              EXISTS (
                SELECT 1 FROM post_media pm
                JOIN post p ON p.id = pm.postId
                WHERE pm.mediaId = media.id
                ${channelCondition}
                AND p.status = 'posted'
              )
              AND ${channelCooldownExpired}
              ${subredditNotOnCooldown}
              AND media.excluded != 1
            )`,
        {
          ...channelParams,
          ...(item.channelId ? { [`rsChannelId2_${paramIndex}`]: item.channelId } : {}),
          [`rsCutoff${paramIndex}`]: cutoffIso,
          ...subredditParams,
        },
      );
      break;
    }

    case "still_growing": {
      // Same SQL as repostable — plateau detection is a post-query JS step
      const channelCooldownExpired = `NOT EXISTS (
                SELECT 1 FROM post_media pm2
                JOIN post p2 ON p2.id = pm2.postId
                WHERE pm2.mediaId = media.id
                ${channelCondition.replace(/p\./g, "p2.").replace(/rsChannelId/g, "rsChannelId2_")}
                AND p2.status = 'posted'
                AND p2.date >= :rsCutoff${paramIndex}
              )`;

      const subredditNotOnCooldown = subredditOnCooldownSql
        ? `AND NOT ${subredditOnCooldownSql}`
        : "";

      queryBuilder.andWhere(
        `${operator}(
              EXISTS (
                SELECT 1 FROM post_media pm
                JOIN post p ON p.id = pm.postId
                WHERE pm.mediaId = media.id
                ${channelCondition}
                AND p.status = 'posted'
              )
              AND ${channelCooldownExpired}
              ${subredditNotOnCooldown}
              AND media.excluded != 1
            )`,
        {
          ...channelParams,
          ...(item.channelId ? { [`rsChannelId2_${paramIndex}`]: item.channelId } : {}),
          [`rsCutoff${paramIndex}`]: cutoffIso,
          ...subredditParams,
        },
      );
      break;
    }
  }
};
