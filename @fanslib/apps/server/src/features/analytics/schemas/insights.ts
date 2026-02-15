import { z } from "zod";

// Base ActionableInsight schema
const BaseSupportingDataSchema = z.object({
  sampleSize: z.number(),
  timeRange: z.string(),
});

export const ActionableInsightTypeSchema = z.union([
  z.literal("videoLength"),
  z.literal("hashtag"),
  z.literal("contentTheme"),
  z.literal("postTiming"),
]);

export const ActionableInsightSchema = z.object({
  type: ActionableInsightTypeSchema,
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: BaseSupportingDataSchema.and(z.record(z.string(), z.unknown())),
});

// VideoLengthInsight
const PerformanceByRangeSchema = z.object({
  range: z.string(),
  avgViews: z.number(),
  avgEngagement: z.number(),
  sampleSize: z.number(),
});

const VideoLengthSupportingDataSchema = BaseSupportingDataSchema.extend({
  optimalRange: z.tuple([z.number(), z.number()]),
  performanceByRange: z.array(PerformanceByRangeSchema),
});

export const VideoLengthInsightSchema = z.object({
  type: z.literal("videoLength"),
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: VideoLengthSupportingDataSchema,
});

// HashtagInsight
const ComparisonDataSchema = z.object({
  withHashtag: z.object({
    avgViews: z.number(),
    avgEngagement: z.number(),
  }),
  withoutHashtag: z.object({
    avgViews: z.number(),
    avgEngagement: z.number(),
  }),
});

const HashtagSupportingDataSchema = BaseSupportingDataSchema.extend({
  hashtag: z.string(),
  performanceBoost: z.number(),
  usageCount: z.number(),
  comparisonData: ComparisonDataSchema,
});

export const HashtagInsightSchema = z.object({
  type: z.literal("hashtag"),
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: HashtagSupportingDataSchema,
});

// ContentThemeInsight
const ContentThemeSupportingDataSchema = BaseSupportingDataSchema.extend({
  theme: z.string(),
  keywords: z.array(z.string()),
  performanceBoost: z.number(),
  postCount: z.number(),
  avgViews: z.number(),
  avgEngagement: z.number(),
});

export const ContentThemeInsightSchema = z.object({
  type: z.literal("contentTheme"),
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: ContentThemeSupportingDataSchema,
});

// PostTimingInsight
const TimeSlotDataSchema = z.object({
  timeSlot: z.string(),
  avgViews: z.number(),
  avgEngagement: z.number(),
  postCount: z.number(),
});

const PostTimingSupportingDataSchema = BaseSupportingDataSchema.extend({
  optimalTimeSlot: z.string(),
  performanceBoost: z.number(),
  postCount: z.number(),
  avgViews: z.number(),
  avgEngagement: z.number(),
  timeSlotData: z.array(TimeSlotDataSchema),
});

export const PostTimingInsightSchema = z.object({
  type: z.literal("postTiming"),
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: PostTimingSupportingDataSchema,
});
