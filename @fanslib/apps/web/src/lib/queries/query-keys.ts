/**
 * Centralized query key registry for TanStack Query
 * 
 * This file contains all query key patterns used throughout the application.
 * Using factory functions ensures type safety and prevents typos.
 * 
 * @example
 * ```ts
 * // Instead of:
 * queryKey: ['posts', 'list', params]
 * 
 * // Use:
 * queryKey: QUERY_KEYS.posts.list(params)
 * ```
 */

import type {
  FetchAllMediaRequestBody,
  FetchCaptionQueueRequestQuery,
  FetchMediaTagsRequestQuery,
  FetchTagsByDimensionQuery,
  FetchTagDefinitionsByIdsRequestQuery,
  FetchVirtualPostsRequestQuery,
  FypActionsQuery,
  GetFanslyPostsWithAnalyticsQuery,
} from '@fanslib/server/schemas';
import type { TagAnalyticsParams } from '../../hooks/useTagAnalytics';

export const QUERY_KEYS = {
  analytics: {
    all: ['analytics'] as const,
    health: () => ['analytics', 'health'] as const,
    fypActions: (params?: FypActionsQuery) => ['analytics', 'fyp-actions', params] as const,
    posts: (params?: GetFanslyPostsWithAnalyticsQuery) => ['analytics', 'posts', params] as const,
    candidates: () => ['analytics', 'candidates'] as const,
    hashtags: () => ['analytics', 'hashtags'] as const,
    time: () => ['analytics', 'time'] as const,
    insights: () => ['analytics', 'insights'] as const,
    datapoints: (postMediaId: string) => ['analytics', 'datapoints', postMediaId] as const,
  },

  posts: {
    all: ['posts'] as const,
    list: (params?: { filters?: string }) => ['posts', 'list', params] as const,
    byId: (id: string) => ['posts', id] as const,
    byChannel: (channelId: string) => ['posts', 'by-channel', channelId] as const,
    byMedia: (mediaId: string) => ['posts', 'by-media', mediaId] as const,
    recent: (channelId: string, limit?: number) => ['posts', 'recent', channelId, limit] as const,
    temporalContext: (channelId: string | 'all', centerDate: string) =>
      ['posts', 'temporal-context', channelId, centerDate] as const,
    drafts: (channelIds: string[], fromDate: string, toDate: string) =>
      ['posts', 'list', 'drafts', channelIds, fromDate, toDate] as const,
  },

  media: {
    all: ['media'] as const,
    list: (params?: FetchAllMediaRequestBody) => ['media', 'list', params] as const,
    byId: (id: string) => ['media', id] as const,
    adjacent: (id: string, body?: unknown) => ['media', id, 'adjacent', body] as const,
    postingHistory: (id: string) => ['media', id, 'posting-history'] as const,
  },

  tags: {
    dimensions: {
      all: () => ['tags', 'dimensions'] as const,
      byId: (id: string) => ['tags', 'dimensions', id] as const,
    },
    definitions: {
      all: () => ['tags', 'definitions'] as const,
      byId: (id: string) => ['tags', 'definitions', id] as const,
      byDimension: (query: FetchTagsByDimensionQuery) =>
        ['tags', 'definitions', 'by-dimension', query.dimensionId] as const,
      byIds: (query: FetchTagDefinitionsByIdsRequestQuery) =>
        ['tags', 'definitions', 'by-ids', query.ids] as const,
    },
    media: {
      all: () => ['tags', 'media'] as const,
      byMediaId: (mediaId: string, query?: FetchMediaTagsRequestQuery) =>
        ['tags', 'media', mediaId, query?.dimensionId] as const,
      bulk: (mediaIds: string[], dimensionId?: number) =>
        ['tags', 'media', 'bulk', mediaIds, dimensionId] as const,
      forMedias: (mediaIds: string[]) => ['tags', 'media', 'for-medias', mediaIds] as const,
    },
    driftPrevention: {
      stats: () => ['tags', 'drift-prevention', 'stats'] as const,
    },
  },

  tagAnalytics: {
    analytics: (params: TagAnalyticsParams) => ['tag-analytics', params] as const,
    performanceMetrics: (tagIds: number[], timeRange: { start: Date; end: Date }) =>
      ['tag-performance-metrics', tagIds, timeRange] as const,
    correlations: (dimensionId?: number) => ['tag-correlations', dimensionId] as const,
    trends: (tagIds: number[], timeRange: { start: Date; end: Date }) =>
      ['tag-trends', tagIds, timeRange] as const,
  },

  channels: {
    all: () => ['channels', 'list'] as const,
    byId: (id: string) => ['channels', id] as const,
    types: () => ['channels', 'types'] as const,
  },

  subreddits: {
    all: () => ['subreddits', 'list'] as const,
    byId: (id: string) => ['subreddits', id] as const,
    lastPostDates: (subredditIds: string[]) =>
      ['subreddits', 'last-post-dates', subredditIds] as const,
  },

  shoots: {
    all: () => ['shoots'] as const,
    list: (params?: unknown) => ['shoots', 'list', params] as const,
    byId: (id: string) => ['shoots', id] as const,
    posts: (shootId: string) => ['shoots', 'posts', shootId] as const,
  },

  hashtags: {
    all: () => ['hashtags', 'list'] as const,
    byId: (id: string) => ['hashtags', id] as const,
    byIds: (ids?: string) => ['hashtags', 'by-ids', ids] as const,
    stats: (id: string) => ['hashtags', id, 'stats'] as const,
  },

  snippets: {
    all: () => ['snippets', 'list'] as const,
    byId: (id: string) => ['snippets', id] as const,
    global: () => ['snippets', 'global'] as const,
    byChannel: (channelId: string) => ['snippets', 'by-channel', channelId] as const,
  },

  contentSchedules: {
    all: () => ['content-schedules'] as const,
    list: () => ['content-schedules', 'list'] as const,
    byId: (id: string) => ['content-schedules', id] as const,
    byChannel: (channelId: string) => ['content-schedules', 'by-channel', channelId] as const,
    virtualPosts: (params: FetchVirtualPostsRequestQuery) =>
      ['content-schedules', 'virtual-posts', params] as const,
  },

  filterPresets: {
    all: () => ['filter-presets', 'list'] as const,
    byId: (id: string) => ['filter-presets', id] as const,
  },

  settings: {
    all: () => ['settings'] as const,
    fanslyCredentials: () => ['settings', 'fansly-credentials'] as const,
  },

  pipeline: {
    all: ['pipeline'] as const,
    captionQueue: (params: FetchCaptionQueueRequestQuery) =>
      ['pipeline', 'caption-queue', params] as const,
  },

  reddit: {
    loginStatus: (userId?: string) => ['reddit', 'login-status', userId] as const,
    sessionStatus: (userId?: string) => ['reddit', 'session-status', userId] as const,
  },

  redditAutomation: {
    scheduledPosts: () => ['reddit-automation', 'scheduled-posts'] as const,
  },

  automation: {
    isRunning: () => ['automation', 'is-running'] as const,
  },

  companion: {
    health: () => ['companion', 'health'] as const,
  },
} as const;
