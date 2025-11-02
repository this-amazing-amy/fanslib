import type {
  ActionableInsight,
  ContentThemeInsight,
  FanslyPostWithAnalytics,
  HashtagInsight,
  PostTimingInsight,
  VideoLengthInsight,
} from "@fanslib/types";

const extractHashtagsFromCaption = (caption: string): string[] => caption?.match(/#\w+/g) ?? [];

const calculateConfidenceScore = (
  sampleSize: number,
  variance: number,
  effectSize: number
): number => {
  const maxSampleSize = 100;

  const sampleSizeScore = Math.min(sampleSize / maxSampleSize, 1);
  const varianceScore = Math.max(0, 1 - variance / 100);
  const effectSizeScore = Math.min(Math.abs(effectSize) / 50, 1);

  return Math.max(0.1, sampleSizeScore * 0.4 + varianceScore * 0.3 + effectSizeScore * 0.3);
};

const groupPostsByLengthRange = (posts: FanslyPostWithAnalytics[]) => {
  const ranges = [
    { min: 0, max: 6, label: "0-6s" },
    { min: 6, max: 8, label: "6-8s" },
    { min: 8, max: 10, label: "8-10s" },
    { min: 10, max: 15, label: "10-15s" },
    { min: 15, max: 30, label: "15-30s" },
    { min: 30, max: Infinity, label: "30s+" },
  ];

  return ranges
    .map((range) => {
      const postsInRange = posts.filter(
        (post) => post.videoLength >= range.min && post.videoLength < range.max
      );

      if (postsInRange.length === 0) return null;

      const avgViews =
        postsInRange.reduce((sum, post) => sum + post.totalViews, 0) / postsInRange.length;
      const avgEngagement =
        postsInRange.reduce((sum, post) => sum + post.averageEngagementPercent, 0) /
        postsInRange.length;

      return {
        range: range.label,
        avgViews,
        avgEngagement,
        sampleSize: postsInRange.length,
        actualRange: [range.min, range.max === Infinity ? 120 : range.max] as [number, number],
      };
    })
    .filter((range): range is NonNullable<typeof range> => range !== null);
};

export const generateVideoLengthInsight = (
  posts: FanslyPostWithAnalytics[]
): VideoLengthInsight | null => {
  const validPosts = posts.filter((post) => post.videoLength > 0);

  if (validPosts.length < 5) return null;

  const rangeData = groupPostsByLengthRange(validPosts);

  if (rangeData.length < 2) return null;

  const bestRange = rangeData.reduce((best, current) =>
    current.avgEngagement > best.avgEngagement ? current : best
  );

  const avgEngagement =
    validPosts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / validPosts.length;
  const performanceBoost = ((bestRange.avgEngagement - avgEngagement) / avgEngagement) * 100;

  const variance =
    rangeData.reduce((sum, range) => sum + Math.pow(range.avgEngagement - avgEngagement, 2), 0) /
    rangeData.length;

  const confidence = calculateConfidenceScore(bestRange.sampleSize, variance, performanceBoost);

  return {
    type: "videoLength",
    confidence,
    recommendation: `Videos in the ${bestRange.range} range perform ${performanceBoost.toFixed(1)}% better than average. Consider focusing on this length for optimal engagement.`,
    supportingData: {
      sampleSize: validPosts.length,
      timeRange: "All time",
      optimalRange: bestRange.actualRange,
      performanceByRange: rangeData,
    },
  };
};

export const generateHashtagInsights = (posts: FanslyPostWithAnalytics[]): HashtagInsight[] => {
  const hashtagMap = new Map<string, { posts: FanslyPostWithAnalytics[] }>();
  const postsWithoutHashtags: FanslyPostWithAnalytics[] = [];

  posts.forEach((post) => {
    const hashtags = extractHashtagsFromCaption(post.caption);

    if (hashtags.length === 0) {
      postsWithoutHashtags.push(post);
    } else {
      hashtags.forEach((hashtag) => {
        if (!hashtagMap.has(hashtag)) {
          hashtagMap.set(hashtag, { posts: [] });
        }
        hashtagMap.get(hashtag)?.posts.push(post);
      });
    }
  });

  const baselineViews =
    postsWithoutHashtags.length > 0
      ? postsWithoutHashtags.reduce((sum, post) => sum + post.totalViews, 0) /
        postsWithoutHashtags.length
      : posts.reduce((sum, post) => sum + post.totalViews, 0) / posts.length;

  const baselineEngagement =
    postsWithoutHashtags.length > 0
      ? postsWithoutHashtags.reduce((sum, post) => sum + post.averageEngagementPercent, 0) /
        postsWithoutHashtags.length
      : posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / posts.length;

  const insights: HashtagInsight[] = [];

  hashtagMap.forEach((data, hashtag) => {
    if (data.posts.length < 3) return;

    const avgViews = data.posts.reduce((sum, post) => sum + post.totalViews, 0) / data.posts.length;
    const avgEngagement =
      data.posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / data.posts.length;

    const engagementBoost = ((avgEngagement - baselineEngagement) / baselineEngagement) * 100;

    if (engagementBoost > 10) {
      const variance =
        data.posts.reduce(
          (sum, post) => sum + Math.pow(post.averageEngagementPercent - avgEngagement, 2),
          0
        ) / data.posts.length;

      const confidence = calculateConfidenceScore(data.posts.length, variance, engagementBoost);

      insights.push({
        type: "hashtag",
        confidence,
        recommendation: `Using ${hashtag} improves engagement by ${engagementBoost.toFixed(1)}%. Consider using it more frequently in your posts.`,
        supportingData: {
          sampleSize: posts.length,
          timeRange: "All time",
          hashtag,
          performanceBoost: engagementBoost,
          usageCount: data.posts.length,
          comparisonData: {
            withHashtag: { avgViews, avgEngagement },
            withoutHashtag: { avgViews: baselineViews, avgEngagement: baselineEngagement },
          },
        },
      });
    }
  });

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};

export const generateContentThemeInsights = (
  posts: FanslyPostWithAnalytics[]
): ContentThemeInsight[] => {
  const commonWords = [
    "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "a", "an",
  ];
  const themeMap = new Map<string, { posts: FanslyPostWithAnalytics[]; keywords: Set<string> }>();

  posts.forEach((post) => {
    if (!post.caption) return;

    const words = post.caption
      .toLowerCase()
      .replace(/#\w+/g, "")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.includes(word));

    words.forEach((word) => {
      if (!themeMap.has(word)) {
        themeMap.set(word, { posts: [], keywords: new Set() });
      }
      themeMap.get(word)?.posts.push(post);
      themeMap.get(word)?.keywords.add(word);
    });
  });

  const insights: ContentThemeInsight[] = [];
  const avgEngagement =
    posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / posts.length;

  themeMap.forEach((data, theme) => {
    if (data.posts.length < 4) return;

    const avgThemeEngagement =
      data.posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / data.posts.length;
    const avgThemeViews =
      data.posts.reduce((sum, post) => sum + post.totalViews, 0) / data.posts.length;
    const performanceBoost = ((avgThemeEngagement - avgEngagement) / avgEngagement) * 100;

    if (performanceBoost > 15) {
      const variance =
        data.posts.reduce(
          (sum, post) => sum + Math.pow(post.averageEngagementPercent - avgThemeEngagement, 2),
          0
        ) / data.posts.length;

      const confidence = calculateConfidenceScore(data.posts.length, variance, performanceBoost);

      insights.push({
        type: "contentTheme",
        confidence,
        recommendation: `Content about "${theme}" performs ${performanceBoost.toFixed(1)}% better than average. Consider creating more content around this theme.`,
        supportingData: {
          sampleSize: posts.length,
          timeRange: "All time",
          theme,
          keywords: Array.from(data.keywords).slice(0, 5),
          performanceBoost,
          postCount: data.posts.length,
          avgViews: avgThemeViews,
          avgEngagement: avgThemeEngagement,
        },
      });
    }
  });

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
};

export const generatePostTimingInsights = (
  posts: FanslyPostWithAnalytics[]
): PostTimingInsight | null => {
  const timeSlotMap = new Map<string, { posts: FanslyPostWithAnalytics[] }>();

  posts.forEach((post) => {
    const date = new Date(post.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const hour = date.getHours();
    const timeSlot = `${dayName} ${hour.toString().padStart(2, "0")}:00-${(hour + 1).toString().padStart(2, "0")}:00`;

    if (!timeSlotMap.has(timeSlot)) {
      timeSlotMap.set(timeSlot, { posts: [] });
    }
    timeSlotMap.get(timeSlot)?.posts.push(post);
  });

  const timeSlotData = Array.from(timeSlotMap.entries())
    .map(([timeSlot, data]) => {
      const avgViews =
        data.posts.reduce((sum, post) => sum + post.totalViews, 0) / data.posts.length;
      const avgEngagement =
        data.posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) /
        data.posts.length;

      return {
        timeSlot,
        avgViews,
        avgEngagement,
        postCount: data.posts.length,
      };
    })
    .filter((slot) => slot.postCount >= 2);

  if (timeSlotData.length < 3) return null;

  const avgEngagement =
    posts.reduce((sum, post) => sum + post.averageEngagementPercent, 0) / posts.length;
  const bestTimeSlot = timeSlotData.reduce((best, current) =>
    current.avgEngagement > best.avgEngagement ? current : best
  );

  const performanceBoost = ((bestTimeSlot.avgEngagement - avgEngagement) / avgEngagement) * 100;

  if (performanceBoost < 10) return null;

  const variance =
    timeSlotData.reduce((sum, slot) => sum + Math.pow(slot.avgEngagement - avgEngagement, 2), 0) /
    timeSlotData.length;

  const confidence = calculateConfidenceScore(bestTimeSlot.postCount, variance, performanceBoost);

  return {
    type: "postTiming",
    confidence,
    recommendation: `Posting during ${bestTimeSlot.timeSlot} results in ${performanceBoost.toFixed(1)}% better engagement. Schedule your content for this time window.`,
    supportingData: {
      sampleSize: posts.length,
      timeRange: "All time",
      optimalTimeSlot: bestTimeSlot.timeSlot,
      performanceBoost,
      postCount: bestTimeSlot.postCount,
      avgViews: bestTimeSlot.avgViews,
      avgEngagement: bestTimeSlot.avgEngagement,
      timeSlotData: timeSlotData.sort((a, b) => b.avgEngagement - a.avgEngagement),
    },
  };
};

export const generateInsights = async (
  posts: FanslyPostWithAnalytics[]
): Promise<ActionableInsight[]> => {
  const insights: ActionableInsight[] = [];

  const videoLengthInsight = generateVideoLengthInsight(posts);
  if (videoLengthInsight) {
    insights.push(videoLengthInsight);
  }

  const hashtagInsights = generateHashtagInsights(posts);
  insights.push(...hashtagInsights);

  const contentThemeInsights = generateContentThemeInsights(posts);
  insights.push(...contentThemeInsights);

  const postTimingInsight = generatePostTimingInsights(posts);
  if (postTimingInsight) {
    insights.push(postTimingInsight);
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
};



