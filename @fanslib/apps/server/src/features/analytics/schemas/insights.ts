import { t } from "elysia";

// Base ActionableInsight schema
const BaseSupportingDataSchema = t.Object({
  sampleSize: t.Number(),
  timeRange: t.String(),
});

export const ActionableInsightTypeSchema = t.Union([
  t.Literal("videoLength"),
  t.Literal("hashtag"),
  t.Literal("contentTheme"),
  t.Literal("postTiming"),
]);

export const ActionableInsightSchema = t.Object({
  type: ActionableInsightTypeSchema,
  confidence: t.Number(),
  recommendation: t.String(),
  supportingData: t.Intersect([
    BaseSupportingDataSchema,
    t.Record(t.String(), t.Unknown()),
  ]),
});

// VideoLengthInsight
const PerformanceByRangeSchema = t.Object({
  range: t.String(),
  avgViews: t.Number(),
  avgEngagement: t.Number(),
  sampleSize: t.Number(),
});

const VideoLengthSupportingDataSchema = t.Intersect([
  BaseSupportingDataSchema,
  t.Object({
    optimalRange: t.Tuple([t.Number(), t.Number()]),
    performanceByRange: t.Array(PerformanceByRangeSchema),
  }),
]);

export const VideoLengthInsightSchema = t.Intersect([
  t.Object({
    type: t.Literal("videoLength"),
    confidence: t.Number(),
    recommendation: t.String(),
  }),
  t.Object({
    supportingData: VideoLengthSupportingDataSchema,
  }),
]);

// HashtagInsight
const ComparisonDataSchema = t.Object({
  withHashtag: t.Object({
    avgViews: t.Number(),
    avgEngagement: t.Number(),
  }),
  withoutHashtag: t.Object({
    avgViews: t.Number(),
    avgEngagement: t.Number(),
  }),
});

const HashtagSupportingDataSchema = t.Intersect([
  BaseSupportingDataSchema,
  t.Object({
    hashtag: t.String(),
    performanceBoost: t.Number(),
    usageCount: t.Number(),
    comparisonData: ComparisonDataSchema,
  }),
]);

export const HashtagInsightSchema = t.Intersect([
  t.Object({
    type: t.Literal("hashtag"),
    confidence: t.Number(),
    recommendation: t.String(),
  }),
  t.Object({
    supportingData: HashtagSupportingDataSchema,
  }),
]);

// ContentThemeInsight
const ContentThemeSupportingDataSchema = t.Intersect([
  BaseSupportingDataSchema,
  t.Object({
    theme: t.String(),
    keywords: t.Array(t.String()),
    performanceBoost: t.Number(),
    postCount: t.Number(),
    avgViews: t.Number(),
    avgEngagement: t.Number(),
  }),
]);

export const ContentThemeInsightSchema = t.Intersect([
  t.Object({
    type: t.Literal("contentTheme"),
    confidence: t.Number(),
    recommendation: t.String(),
  }),
  t.Object({
    supportingData: ContentThemeSupportingDataSchema,
  }),
]);

// PostTimingInsight
const TimeSlotDataSchema = t.Object({
  timeSlot: t.String(),
  avgViews: t.Number(),
  avgEngagement: t.Number(),
  postCount: t.Number(),
});

const PostTimingSupportingDataSchema = t.Intersect([
  BaseSupportingDataSchema,
  t.Object({
    optimalTimeSlot: t.String(),
    performanceBoost: t.Number(),
    postCount: t.Number(),
    avgViews: t.Number(),
    avgEngagement: t.Number(),
    timeSlotData: t.Array(TimeSlotDataSchema),
  }),
]);

export const PostTimingInsightSchema = t.Intersect([
  t.Object({
    type: t.Literal("postTiming"),
    confidence: t.Number(),
    recommendation: t.String(),
  }),
  t.Object({
    supportingData: PostTimingSupportingDataSchema,
  }),
]);
