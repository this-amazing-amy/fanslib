import type { TimeAnalytics } from "@fanslib/types";
import { getFanslyPostsWithAnalytics } from "./fetch-posts-with-analytics";

export const getTimeAnalytics = async (): Promise<TimeAnalytics> => {
  const posts = await getFanslyPostsWithAnalytics();

  const timeMap = new Map<string, { totalViews: number; totalEngagement: number; count: number }>();

  posts.forEach((post) => {
    const date = new Date(post.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const hour = date.getHours();
    const timeSlot = `${hour.toString().padStart(2, "0")}:00-${(hour + 1).toString().padStart(2, "0")}:00`;
    const timePeriod = `${dayName} ${timeSlot}`;

    const existing = timeMap.get(timePeriod) ?? { totalViews: 0, totalEngagement: 0, count: 0 };
    timeMap.set(timePeriod, {
      totalViews: existing.totalViews + post.totalViews,
      totalEngagement: existing.totalEngagement + post.averageEngagementPercent,
      count: existing.count + 1,
    });
  });

  return Array.from(timeMap.entries())
    .map(([timePeriod, data]) => ({
      timePeriod,
      postCount: data.count,
      avgViews: data.totalViews / data.count,
      avgEngagement: data.totalEngagement / data.count,
    }))
    .filter((entry) => entry.postCount >= 1)
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
};

