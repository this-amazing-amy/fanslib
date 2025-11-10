import { HashtagAnalyticsSchema } from "../../schemas/analytics";
import { getFanslyPostsWithAnalytics } from "./fetch-posts-with-analytics";

export const GetHashtagAnalyticsResponseSchema = HashtagAnalyticsSchema;

export const getHashtagAnalytics = async (): Promise<typeof GetHashtagAnalyticsResponseSchema.static> => {
  const posts = await getFanslyPostsWithAnalytics();

  const hashtagMap = new Map<
    string,
    { totalViews: number; totalEngagement: number; count: number }
  >();

  posts.forEach((post) => {
    post.hashtags.forEach((hashtag) => {
      const existing = hashtagMap.get(hashtag) ?? { totalViews: 0, totalEngagement: 0, count: 0 };
      hashtagMap.set(hashtag, {
        totalViews: existing.totalViews + post.totalViews,
        totalEngagement: existing.totalEngagement + post.averageEngagementPercent,
        count: existing.count + 1,
      });
    });
  });

  return Array.from(hashtagMap.entries())
    .map(([hashtag, data]) => ({
      hashtag,
      postCount: data.count,
      avgViews: data.totalViews / data.count,
      avgEngagement: data.totalEngagement / data.count,
    }))
    .filter((entry) => entry.postCount >= 2)
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
};

