import type { Media } from "../library/types";

export type ActionableInsight = {
    type: "videoLength" | "hashtag" | "contentTheme" | "postTiming";
    confidence: number; // 0-1 scale based on statistical significance
    recommendation: string; // Human-readable recommendation
    supportingData: {
      // Common fields
      sampleSize: number;
      timeRange: string; // e.g., "Last 30 days"
      // Type-specific fields
      [key: string]: unknown; // Additional data to render the insight
    };
  };
  
export type VideoLengthInsight = ActionableInsight & {
  supportingData: {
    sampleSize: number;
    timeRange: string;
    optimalRange: [number, number]; // seconds
    performanceByRange: {
      range: string;
      avgViews: number;
      avgEngagement: number;
      sampleSize: number;
    }[];
  };
};

export type HashtagInsight = ActionableInsight & {
  supportingData: {
    sampleSize: number;
    timeRange: string;
    hashtag: string;
    performanceBoost: number; // percentage
    usageCount: number;
    comparisonData: {
      withHashtag: { avgViews: number; avgEngagement: number };
      withoutHashtag: { avgViews: number; avgEngagement: number };
    };
  };
};

export type ContentThemeInsight = ActionableInsight & {
  supportingData: {
    sampleSize: number;
    timeRange: string;
    theme: string;
    keywords: string[];
    performanceBoost: number; // percentage
    postCount: number;
    avgViews: number;
    avgEngagement: number;
  };
};

export type PostTimingInsight = ActionableInsight & {
  supportingData: {
    sampleSize: number;
    timeRange: string;
    optimalTimeSlot: string;
    performanceBoost: number; // percentage
    postCount: number;
    avgViews: number;
    avgEngagement: number;
    timeSlotData: {
      timeSlot: string;
      avgViews: number;
      avgEngagement: number;
      postCount: number;
    }[];
  };
};

export type FanslyPostWithAnalytics = {
  id: string;
  date: string;
  caption: string;
  thumbnailUrl: string;
  postUrl?: string;
  statisticsUrl?: string;
  totalViews: number;
  averageEngagementSeconds: number;
  averageEngagementPercent: number;
  hashtags: string[];
  videoLength: number;
  media?: Media | undefined;
};

export type HashtagAnalytics = {
  hashtag: string;
  postCount: number;
  avgViews: number;
  avgEngagement: number;
}[];

export type TimeAnalytics = {
  timePeriod: string; // e.g., "Monday 12-2pm"
  postCount: number;
  avgViews: number;
  avgEngagement: number;
}[];