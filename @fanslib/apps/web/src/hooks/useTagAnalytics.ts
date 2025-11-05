import { useQuery } from "@tanstack/react-query";

export type TagAnalyticsParams = {
  tagIds?: number[];
  dimensionIds?: number[];
  timeRange?: { start: Date; end: Date };
  metrics?: string[];
};

export type TagPerformanceMetrics = {
  tagId: number;
  tagName: string;
  dimensionName: string;
  totalAssignments: number;
  averageEngagement: number;
  topPerformingMedia: string[];
  trendDirection: "up" | "down" | "stable";
  confidenceScore: number;
};

export type TagCorrelationData = {
  tagId1: number;
  tagId2: number;
  correlationStrength: number;
  combinedPerformance: number;
  coOccurrenceCount: number;
};

export const tagAnalyticsQueryKeys = {
  tagAnalytics: (params: TagAnalyticsParams) => ["tag-analytics", params],
  tagPerformanceMetrics: (tagIds: number[], timeRange: { start: Date; end: Date }) => [
    "tag-performance-metrics",
    tagIds,
    timeRange,
  ],
  tagCorrelations: (dimensionId?: number) => ["tag-correlations", dimensionId],
  tagTrends: (tagIds: number[], timeRange: { start: Date; end: Date }) => [
    "tag-trends",
    tagIds,
    timeRange,
  ],
};

// TODO: Implement tag analytics API endpoints in the backend
// For now, these hooks return placeholder data
export const useTagAnalytics = (params: TagAnalyticsParams) => useQuery<TagPerformanceMetrics[]>({
    queryKey: tagAnalyticsQueryKeys.tagAnalytics(params),
    queryFn: async () => [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

export const useTagPerformanceMetrics = (tagIds: number[], timeRange: { start: Date; end: Date }) => useQuery<TagPerformanceMetrics[]>({
    queryKey: tagAnalyticsQueryKeys.tagPerformanceMetrics(tagIds, timeRange),
    queryFn: async () => [],
    enabled: tagIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useTagCorrelations = (dimensionId?: number) => useQuery<TagCorrelationData[]>({
    queryKey: tagAnalyticsQueryKeys.tagCorrelations(dimensionId),
    queryFn: async () => [],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

export const useTagTrends = (tagIds: number[], timeRange: { start: Date; end: Date }) => useQuery({
    queryKey: tagAnalyticsQueryKeys.tagTrends(tagIds, timeRange),
    queryFn: async () => [],
    enabled: tagIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
