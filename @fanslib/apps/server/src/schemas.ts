import type { z } from 'zod';
import type { Static } from 'elysia';

// Media schemas
import {
  FetchAllMediaRequestBodySchema,
  FetchAllMediaResponseSchema
} from './features/library/operations/media/fetch-all';
export {
  FetchAllMediaRequestBodySchema,
  FetchAllMediaResponseSchema
};
export type FetchAllMediaRequestBody = z.infer<typeof FetchAllMediaRequestBodySchema>;
export type FetchAllMediaResponse = z.infer<typeof FetchAllMediaResponseSchema>;


import {
  FetchMediaByIdRequestParamsSchema,
  FetchMediaByIdResponseSchema
} from './features/library/operations/media/fetch-by-id';
export {
  FetchMediaByIdRequestParamsSchema,
  FetchMediaByIdResponseSchema
};
export type FetchMediaByIdRequestParams = z.infer<typeof FetchMediaByIdRequestParamsSchema>;
export type FetchMediaByIdResponse = z.infer<typeof FetchMediaByIdResponseSchema>;


import {
  UpdateMediaRequestBodySchema, UpdateMediaRequestParamsSchema, UpdateMediaResponseSchema
} from './features/library/operations/media/update';
export {
  UpdateMediaRequestBodySchema, UpdateMediaRequestParamsSchema, UpdateMediaResponseSchema
};
export type UpdateMediaRequestBody = z.infer<typeof UpdateMediaRequestBodySchema>;
export type UpdateMediaRequestParams = z.infer<typeof UpdateMediaRequestParamsSchema>;
export type UpdateMediaResponse = z.infer<typeof UpdateMediaResponseSchema>;


import {
  DeleteMediaQuerySchema, DeleteMediaRequestParamsSchema, DeleteMediaResponseSchema
} from './features/library/operations/media/delete';
export {
  DeleteMediaQuerySchema, DeleteMediaRequestParamsSchema, DeleteMediaResponseSchema
};
export type DeleteMediaQuery = z.infer<typeof DeleteMediaQuerySchema>;
export type DeleteMediaRequestParams = z.infer<typeof DeleteMediaRequestParamsSchema>;
export type DeleteMediaResponse = z.infer<typeof DeleteMediaResponseSchema>;


import {
  FindAdjacentMediaBodySchema, FindAdjacentMediaRequestParamsSchema, FindAdjacentMediaResponseSchema
} from './features/library/operations/media/find-adjacent';
export {
  FindAdjacentMediaBodySchema, FindAdjacentMediaRequestParamsSchema, FindAdjacentMediaResponseSchema
};
export type FindAdjacentMediaBody = z.infer<typeof FindAdjacentMediaBodySchema>;
export type FindAdjacentMediaRequestParams = z.infer<typeof FindAdjacentMediaRequestParamsSchema>;
export type FindAdjacentMediaResponse = z.infer<typeof FindAdjacentMediaResponseSchema>;


import {
  LibraryScanProgressSchema,
  LibraryScanResultSchema, ScanLibraryResponseSchema,
  ScanStatusResponseSchema
} from './features/library/operations/scan/scan';
export {
  LibraryScanProgressSchema,
  LibraryScanResultSchema, ScanLibraryResponseSchema,
  ScanStatusResponseSchema
};
export type LibraryScanProgress = z.infer<typeof LibraryScanProgressSchema>;
export type LibraryScanResult = z.infer<typeof LibraryScanResultSchema>;
export type ScanLibraryResponse = z.infer<typeof ScanLibraryResponseSchema>;
export type ScanStatusResponse = z.infer<typeof ScanStatusResponseSchema>;


// Media entities
import { MediaSchema, MediaTypeSchema } from './features/library/schema';
export { MediaSchema, MediaTypeSchema };
export type Media = z.infer<typeof MediaSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;


// Media filters
import {
  FilterItemSchema,
  FilterItemChannelSchema,
  FilterItemSubredditSchema,
  FilterItemTagSchema,
  FilterItemShootSchema,
  FilterItemFilenameSchema,
  FilterItemCaptionSchema,
  FilterItemPostedSchema,
  FilterItemCreatedDateStartSchema,
  FilterItemCreatedDateEndSchema,
  FilterItemMediaTypeSchema,
  FilterItemDimensionEmptySchema,
  FilterGroupSchema,
  MediaFilterSchema
} from './features/library/schemas/media-filter';
export {
  FilterItemSchema,
  FilterItemChannelSchema,
  FilterItemSubredditSchema,
  FilterItemTagSchema,
  FilterItemShootSchema,
  FilterItemFilenameSchema,
  FilterItemCaptionSchema,
  FilterItemPostedSchema,
  FilterItemCreatedDateStartSchema,
  FilterItemCreatedDateEndSchema,
  FilterItemMediaTypeSchema,
  FilterItemDimensionEmptySchema,
  FilterGroupSchema,
  MediaFilterSchema
};
export type FilterItem = z.infer<typeof FilterItemSchema>;
export type FilterItemChannel = z.infer<typeof FilterItemChannelSchema>;
export type FilterItemSubreddit = z.infer<typeof FilterItemSubredditSchema>;
export type FilterItemTag = z.infer<typeof FilterItemTagSchema>;
export type FilterItemShoot = z.infer<typeof FilterItemShootSchema>;
export type FilterItemFilename = z.infer<typeof FilterItemFilenameSchema>;
export type FilterItemCaption = z.infer<typeof FilterItemCaptionSchema>;
export type FilterItemPosted = z.infer<typeof FilterItemPostedSchema>;
export type FilterItemCreatedDateStart = z.infer<typeof FilterItemCreatedDateStartSchema>;
export type FilterItemCreatedDateEnd = z.infer<typeof FilterItemCreatedDateEndSchema>;
export type FilterItemMediaType = z.infer<typeof FilterItemMediaTypeSchema>;
export type FilterItemDimensionEmpty = z.infer<typeof FilterItemDimensionEmptySchema>;
export type FilterGroup = z.infer<typeof FilterGroupSchema>;
export type MediaFilter = z.infer<typeof MediaFilterSchema>;


// Media sort
import { MediaSortSchema, SortDirectionSchema, SortFieldSchema } from './features/library/schemas/media-sort';
export { MediaSortSchema, SortDirectionSchema, SortFieldSchema };
export type MediaSort = z.infer<typeof MediaSortSchema>;
export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type SortField = z.infer<typeof SortFieldSchema>;


// Posts schemas
import {
  FetchAllPostsResponseSchema,
  PostWithRelationsSchema
} from './features/posts/operations/post/fetch-all';
export {
  FetchAllPostsResponseSchema,
  PostWithRelationsSchema
};
export type FetchAllPostsResponse = z.infer<typeof FetchAllPostsResponseSchema>;
export type PostWithRelations = z.infer<typeof PostWithRelationsSchema>;


import type {
  PostWithRelationsSchema as FetchPostByIdResponseSchema
} from './features/posts/operations/post/fetch-by-id';
export {
  PostWithRelationsSchema as FetchPostByIdResponseSchema
};
export type FetchPostByIdResponse = z.infer<typeof FetchPostByIdResponseSchema>;


import {
  PostWithChannelAndMediaSchema
} from './features/posts/operations/post/fetch-by-channel';
export {
  PostWithChannelAndMediaSchema
};
export type PostWithChannelAndMedia = z.infer<typeof PostWithChannelAndMediaSchema>;


import type {
  PostWithChannelAndMediaSchema as FetchPostsByMediaIdResponseSchema
} from './features/posts/operations/post/fetch-by-media-id';
export {
  PostWithChannelAndMediaSchema as FetchPostsByMediaIdResponseSchema
};
export type FetchPostsByMediaIdResponse = z.infer<typeof FetchPostsByMediaIdResponseSchema>;


import {
  CreatePostRequestBodySchema
} from './features/posts/operations/post/create';
export {
  CreatePostRequestBodySchema
};
export type CreatePostRequestBody = z.infer<typeof CreatePostRequestBodySchema>;


import {
  UpdatePostRequestBodySchema
} from './features/posts/operations/post/update';
export {
  UpdatePostRequestBodySchema
};
export type UpdatePostRequestBody = z.infer<typeof UpdatePostRequestBodySchema>;


// Pipeline schemas
import {
  AssignMediaRequestBodySchema,
  AssignMediaResponseSchema,
  FetchCaptionQueueRequestQuerySchema,
  FetchCaptionQueueResponseSchema,
  CaptionQueueItemSchema
} from './features/pipeline/schema';
export {
  AssignMediaRequestBodySchema,
  AssignMediaResponseSchema,
  FetchCaptionQueueRequestQuerySchema,
  FetchCaptionQueueResponseSchema,
  CaptionQueueItemSchema
};
export type AssignMediaRequestBody = z.infer<typeof AssignMediaRequestBodySchema>;
export type AssignMediaResponse = z.infer<typeof AssignMediaResponseSchema>;
export type FetchCaptionQueueRequestQuery = z.infer<typeof FetchCaptionQueueRequestQuerySchema>;
export type FetchCaptionQueueResponse = z.infer<typeof FetchCaptionQueueResponseSchema>;
export type CaptionQueueItem = z.infer<typeof CaptionQueueItemSchema>;


import {
  AddMediaToPostRequestBodySchema
} from './features/posts/operations/post-media/add';
export {
  AddMediaToPostRequestBodySchema
};
export type AddMediaToPostRequestBody = z.infer<typeof AddMediaToPostRequestBodySchema>;


import {
  RemoveMediaFromPostRequestBodySchema
} from './features/posts/operations/post-media/remove';
export {
  RemoveMediaFromPostRequestBodySchema
};
export type RemoveMediaFromPostRequestBody = z.infer<typeof RemoveMediaFromPostRequestBodySchema>;


import {
  UpdatePostMediaRequestBodySchema
} from './features/posts/operations/post-media/update';
export {
  UpdatePostMediaRequestBodySchema
};
export type UpdatePostMediaRequestBody = z.infer<typeof UpdatePostMediaRequestBodySchema>;


// Posts entities
import { PostMediaSchema, PostMediaWithMediaSchema, PostSchema, PostStatusSchema } from './features/posts/schema';
export { PostMediaSchema, PostMediaWithMediaSchema, PostSchema, PostStatusSchema };
export type PostMedia = z.infer<typeof PostMediaSchema>;
export type PostMediaWithMedia = z.infer<typeof PostMediaWithMediaSchema>;
export type Post = z.infer<typeof PostSchema>;
export type PostStatus = z.infer<typeof PostStatusSchema>;


// Posts filters
import { PostFiltersSchema } from './features/posts/schemas/post-filters';
export { PostFiltersSchema };
export type PostFilters = z.infer<typeof PostFiltersSchema>;


// Channels schemas
import {
  FetchAllChannelsResponseSchema
} from './features/channels/operations/channel/fetch-all';
export {
  FetchAllChannelsResponseSchema
};
export type FetchAllChannelsResponse = z.infer<typeof FetchAllChannelsResponseSchema>;


import {
  FetchChannelByIdRequestParamsSchema,
  FetchChannelByIdResponseSchema
} from './features/channels/operations/channel/fetch-by-id';
export {
  FetchChannelByIdRequestParamsSchema,
  FetchChannelByIdResponseSchema
};
export type FetchChannelByIdRequestParams = z.infer<typeof FetchChannelByIdRequestParamsSchema>;
export type FetchChannelByIdResponse = z.infer<typeof FetchChannelByIdResponseSchema>;


import {
  CreateChannelRequestBodySchema,
  CreateChannelResponseSchema
} from './features/channels/operations/channel/create';
export {
  CreateChannelRequestBodySchema,
  CreateChannelResponseSchema
};
export type CreateChannelRequestBody = z.infer<typeof CreateChannelRequestBodySchema>;
export type CreateChannelResponse = z.infer<typeof CreateChannelResponseSchema>;


import {
  UpdateChannelRequestBodySchema, UpdateChannelRequestParamsSchema, UpdateChannelResponseSchema
} from './features/channels/operations/channel/update';
export {
  UpdateChannelRequestBodySchema, UpdateChannelRequestParamsSchema, UpdateChannelResponseSchema
};
export type UpdateChannelRequestBody = z.infer<typeof UpdateChannelRequestBodySchema>;
export type UpdateChannelRequestParams = z.infer<typeof UpdateChannelRequestParamsSchema>;
export type UpdateChannelResponse = z.infer<typeof UpdateChannelResponseSchema>;


import {
  DeleteChannelRequestParamsSchema,
  DeleteChannelResponseSchema
} from './features/channels/operations/channel/delete';
export {
  DeleteChannelRequestParamsSchema,
  DeleteChannelResponseSchema
};
export type DeleteChannelRequestParams = z.infer<typeof DeleteChannelRequestParamsSchema>;
export type DeleteChannelResponse = z.infer<typeof DeleteChannelResponseSchema>;


import {
  FetchChannelTypesResponseSchema
} from './features/channels/operations/channel-type/fetch-all';
export {
  FetchChannelTypesResponseSchema
};
export type FetchChannelTypesResponse = z.infer<typeof FetchChannelTypesResponseSchema>;


// Channels entities
import { ChannelSchema, ChannelTypeSchema } from './features/channels/entity';
export { ChannelSchema, ChannelTypeSchema };
export type Channel = z.infer<typeof ChannelSchema>;
export type ChannelType = z.infer<typeof ChannelTypeSchema>;


// Subreddits schemas
import {
  FetchAllSubredditsResponseSchema
} from './features/subreddits/operations/subreddit/fetch-all';
export {
  FetchAllSubredditsResponseSchema
};
export type FetchAllSubredditsResponse = z.infer<typeof FetchAllSubredditsResponseSchema>;


import {
  FetchSubredditByIdRequestParamsSchema,
  FetchSubredditByIdResponseSchema
} from './features/subreddits/operations/subreddit/fetch-by-id';
export {
  FetchSubredditByIdRequestParamsSchema,
  FetchSubredditByIdResponseSchema
};
export type FetchSubredditByIdRequestParams = z.infer<typeof FetchSubredditByIdRequestParamsSchema>;
export type FetchSubredditByIdResponse = z.infer<typeof FetchSubredditByIdResponseSchema>;


import {
  CreateSubredditRequestBodySchema,
  CreateSubredditResponseSchema
} from './features/subreddits/operations/subreddit/create';
export {
  CreateSubredditRequestBodySchema,
  CreateSubredditResponseSchema
};
export type CreateSubredditRequestBody = z.infer<typeof CreateSubredditRequestBodySchema>;
export type CreateSubredditResponse = z.infer<typeof CreateSubredditResponseSchema>;


import {
  UpdateSubredditRequestBodySchema, UpdateSubredditRequestParamsSchema, UpdateSubredditResponseSchema
} from './features/subreddits/operations/subreddit/update';
export {
  UpdateSubredditRequestBodySchema, UpdateSubredditRequestParamsSchema, UpdateSubredditResponseSchema
};
export type UpdateSubredditRequestBody = z.infer<typeof UpdateSubredditRequestBodySchema>;
export type UpdateSubredditRequestParams = z.infer<typeof UpdateSubredditRequestParamsSchema>;
export type UpdateSubredditResponse = z.infer<typeof UpdateSubredditResponseSchema>;


import {
  DeleteSubredditParamsSchema,
  DeleteSubredditResponseSchema
} from './features/subreddits/operations/subreddit/delete';
export {
  DeleteSubredditParamsSchema,
  DeleteSubredditResponseSchema
};
export type DeleteSubredditParams = z.infer<typeof DeleteSubredditParamsSchema>;
export type DeleteSubredditResponse = z.infer<typeof DeleteSubredditResponseSchema>;


import {
  FetchLastPostDatesRequestBodySchema,
  FetchLastPostDatesResponseSchema
} from './features/subreddits/operations/subreddit/fetch-last-post-dates';
export {
  FetchLastPostDatesRequestBodySchema,
  FetchLastPostDatesResponseSchema
};
export type FetchLastPostDatesRequestBody = z.infer<typeof FetchLastPostDatesRequestBodySchema>;
export type FetchLastPostDatesResponse = z.infer<typeof FetchLastPostDatesResponseSchema>;


// Subreddits entities
import { SubredditSchema } from './features/subreddits/entity';
export { SubredditSchema };
export type Subreddit = z.infer<typeof SubredditSchema>;


// Tags - Tag Dimensions schemas
import {
  GetAllTagDimensionsResponseSchema
} from './features/tags/operations/tag-dimension/fetch-all';
export {
  GetAllTagDimensionsResponseSchema
};
export type GetAllTagDimensionsResponse = z.infer<typeof GetAllTagDimensionsResponseSchema>;


import {
  FetchTagDimensionByIdRequestParamsSchema,
  FetchTagDimensionByIdResponseSchema
} from './features/tags/operations/tag-dimension/fetch-by-id';
export {
  FetchTagDimensionByIdRequestParamsSchema,
  FetchTagDimensionByIdResponseSchema
};
export type FetchTagDimensionByIdRequestParams = z.infer<typeof FetchTagDimensionByIdRequestParamsSchema>;
export type FetchTagDimensionByIdResponse = z.infer<typeof FetchTagDimensionByIdResponseSchema>;


import {
  CreateTagDimensionRequestBodySchema,
  CreateTagDimensionResponseSchema
} from './features/tags/operations/tag-dimension/create';
export {
  CreateTagDimensionRequestBodySchema,
  CreateTagDimensionResponseSchema
};
export type CreateTagDimensionRequestBody = z.infer<typeof CreateTagDimensionRequestBodySchema>;
export type CreateTagDimensionResponse = z.infer<typeof CreateTagDimensionResponseSchema>;


import {
  UpdateTagDimensionParamsSchema,
  UpdateTagDimensionRequestBodySchema,
  UpdateTagDimensionResponseSchema
} from './features/tags/operations/tag-dimension/update';
export {
  UpdateTagDimensionParamsSchema,
  UpdateTagDimensionRequestBodySchema,
  UpdateTagDimensionResponseSchema
};
export type UpdateTagDimensionParams = z.infer<typeof UpdateTagDimensionParamsSchema>;
export type UpdateTagDimensionRequestBody = z.infer<typeof UpdateTagDimensionRequestBodySchema>;
export type UpdateTagDimensionResponse = z.infer<typeof UpdateTagDimensionResponseSchema>;


import {
  DeleteTagDimensionParamsSchema,
  DeleteTagDimensionResponseSchema
} from './features/tags/operations/tag-dimension/delete';
export {
  DeleteTagDimensionParamsSchema,
  DeleteTagDimensionResponseSchema
};
export type DeleteTagDimensionParams = z.infer<typeof DeleteTagDimensionParamsSchema>;
export type DeleteTagDimensionResponse = z.infer<typeof DeleteTagDimensionResponseSchema>;


// Tags - Tag Definitions schemas
import {
  FetchTagsByDimensionQuerySchema,
  FetchTagsByDimensionResponseSchema
} from './features/tags/operations/tag-definition/fetch-by-dimension';
export {
  FetchTagsByDimensionQuerySchema,
  FetchTagsByDimensionResponseSchema
};
export type FetchTagsByDimensionQuery = z.infer<typeof FetchTagsByDimensionQuerySchema>;
export type FetchTagsByDimensionResponse = z.infer<typeof FetchTagsByDimensionResponseSchema>;


import {
  FetchTagDefinitionByIdRequestParamsSchema,
  FetchTagDefinitionByIdResponseSchema
} from './features/tags/operations/tag-definition/fetch-by-id';
export {
  FetchTagDefinitionByIdRequestParamsSchema,
  FetchTagDefinitionByIdResponseSchema
};
export type FetchTagDefinitionByIdRequestParams = z.infer<typeof FetchTagDefinitionByIdRequestParamsSchema>;
export type FetchTagDefinitionByIdResponse = z.infer<typeof FetchTagDefinitionByIdResponseSchema>;


import {
  FetchTagDefinitionsByIdsRequestQuerySchema,
  FetchTagDefinitionsByIdsResponseSchema
} from './features/tags/operations/tag-definition/fetch-by-ids';
export {
  FetchTagDefinitionsByIdsRequestQuerySchema,
  FetchTagDefinitionsByIdsResponseSchema
};
export type FetchTagDefinitionsByIdsRequestQuery = z.infer<typeof FetchTagDefinitionsByIdsRequestQuerySchema>;
export type FetchTagDefinitionsByIdsResponse = z.infer<typeof FetchTagDefinitionsByIdsResponseSchema>;


import {
  CreateTagDefinitionRequestBodySchema,
  CreateTagDefinitionResponseSchema
} from './features/tags/operations/tag-definition/create';
export {
  CreateTagDefinitionRequestBodySchema,
  CreateTagDefinitionResponseSchema
};
export type CreateTagDefinitionRequestBody = z.infer<typeof CreateTagDefinitionRequestBodySchema>;
export type CreateTagDefinitionResponse = z.infer<typeof CreateTagDefinitionResponseSchema>;


import {
  UpdateTagDefinitionParamsSchema,
  UpdateTagDefinitionRequestBodySchema,
  UpdateTagDefinitionResponseSchema
} from './features/tags/operations/tag-definition/update';
export {
  UpdateTagDefinitionParamsSchema,
  UpdateTagDefinitionRequestBodySchema,
  UpdateTagDefinitionResponseSchema
};
export type UpdateTagDefinitionParams = z.infer<typeof UpdateTagDefinitionParamsSchema>;
export type UpdateTagDefinitionRequestBody = z.infer<typeof UpdateTagDefinitionRequestBodySchema>;
export type UpdateTagDefinitionResponse = z.infer<typeof UpdateTagDefinitionResponseSchema>;


import {
  DeleteTagDefinitionParamsSchema,
  DeleteTagDefinitionResponseSchema
} from './features/tags/operations/tag-definition/delete';
export {
  DeleteTagDefinitionParamsSchema,
  DeleteTagDefinitionResponseSchema
};
export type DeleteTagDefinitionParams = z.infer<typeof DeleteTagDefinitionParamsSchema>;
export type DeleteTagDefinitionResponse = z.infer<typeof DeleteTagDefinitionResponseSchema>;


// Tags - Media Tags schemas
import {
  FetchMediaTagsRequestParamsSchema,
  FetchMediaTagsRequestQuerySchema,
  FetchMediaTagsResponseSchema
} from './features/tags/operations/media-tag/fetch';
export {
  FetchMediaTagsRequestParamsSchema,
  FetchMediaTagsRequestQuerySchema,
  FetchMediaTagsResponseSchema
};
export type FetchMediaTagsRequestParams = z.infer<typeof FetchMediaTagsRequestParamsSchema>;
export type FetchMediaTagsRequestQuery = z.infer<typeof FetchMediaTagsRequestQuerySchema>;
export type FetchMediaTagsResponse = z.infer<typeof FetchMediaTagsResponseSchema>;


import {
  AssignTagsToMediaRequestBodySchema,
  AssignTagsToMediaResponseSchema
} from './features/tags/operations/media-tag/assign';
export {
  AssignTagsToMediaRequestBodySchema,
  AssignTagsToMediaResponseSchema
};
export type AssignTagsToMediaRequestBody = z.infer<typeof AssignTagsToMediaRequestBodySchema>;
export type AssignTagsToMediaResponse = z.infer<typeof AssignTagsToMediaResponseSchema>;


import {
  BulkAssignTagsRequestBodySchema,
  BulkAssignTagsResponseSchema
} from './features/tags/operations/media-tag/bulk-assign';
export {
  BulkAssignTagsRequestBodySchema,
  BulkAssignTagsResponseSchema
};
export type BulkAssignTagsRequestBody = z.infer<typeof BulkAssignTagsRequestBodySchema>;
export type BulkAssignTagsResponse = z.infer<typeof BulkAssignTagsResponseSchema>;


import {
  RemoveTagsFromMediaRequestBodySchema, RemoveTagsFromMediaRequestParamsSchema, RemoveTagsFromMediaResponseSchema
} from './features/tags/operations/media-tag/remove';
export {
  RemoveTagsFromMediaRequestBodySchema, RemoveTagsFromMediaRequestParamsSchema, RemoveTagsFromMediaResponseSchema
};
export type RemoveTagsFromMediaRequestBody = z.infer<typeof RemoveTagsFromMediaRequestBodySchema>;
export type RemoveTagsFromMediaRequestParams = z.infer<typeof RemoveTagsFromMediaRequestParamsSchema>;
export type RemoveTagsFromMediaResponse = z.infer<typeof RemoveTagsFromMediaResponseSchema>;


// Tags entities
import { MediaTagSchema, TagDefinitionSchema, TagDimensionSchema } from './features/tags/entity';
export { MediaTagSchema, TagDefinitionSchema, TagDimensionSchema };
export type TagDefinition = z.infer<typeof TagDefinitionSchema>;
export type TagDimension = z.infer<typeof TagDimensionSchema>;
export type MediaTag = z.infer<typeof MediaTagSchema>;


// Hashtags schemas
import {
  FetchAllHashtagsResponseSchema
} from './features/hashtags/operations/hashtag/fetch-all';
export {
  FetchAllHashtagsResponseSchema
};
export type FetchAllHashtagsResponse = z.infer<typeof FetchAllHashtagsResponseSchema>;


import {
  FetchHashtagByIdRequestParamsSchema,
  FetchHashtagByIdResponseSchema
} from './features/hashtags/operations/hashtag/fetch-by-id';
export {
  FetchHashtagByIdRequestParamsSchema,
  FetchHashtagByIdResponseSchema
};
export type FetchHashtagByIdRequestParams = z.infer<typeof FetchHashtagByIdRequestParamsSchema>;
export type FetchHashtagByIdResponse = z.infer<typeof FetchHashtagByIdResponseSchema>;


import {
  FetchHashtagsByIdsQuerySchema,
  FetchHashtagsByIdsResponseSchema
} from './features/hashtags/operations/hashtag/fetch-by-ids';
export {
  FetchHashtagsByIdsQuerySchema,
  FetchHashtagsByIdsResponseSchema
};
export type FetchHashtagsByIdsQuery = z.infer<typeof FetchHashtagsByIdsQuerySchema>;
export type FetchHashtagsByIdsResponse = z.infer<typeof FetchHashtagsByIdsResponseSchema>;


import {
  FindOrCreateHashtagRequestBodySchema,
  FindOrCreateHashtagResponseSchema,
  FindOrCreateHashtagsByIdsRequestBodySchema,
  FindOrCreateHashtagsByIdsResponseSchema
} from './features/hashtags/operations/hashtag/find-or-create';
export {
  FindOrCreateHashtagRequestBodySchema,
  FindOrCreateHashtagResponseSchema,
  FindOrCreateHashtagsByIdsRequestBodySchema,
  FindOrCreateHashtagsByIdsResponseSchema
};
export type FindOrCreateHashtagRequestBody = z.infer<typeof FindOrCreateHashtagRequestBodySchema>;
export type FindOrCreateHashtagResponse = z.infer<typeof FindOrCreateHashtagResponseSchema>;
export type FindOrCreateHashtagsByIdsRequestBody = z.infer<typeof FindOrCreateHashtagsByIdsRequestBodySchema>;
export type FindOrCreateHashtagsByIdsResponse = z.infer<typeof FindOrCreateHashtagsByIdsResponseSchema>;


import {
  DeleteHashtagRequestParamsSchema,
  DeleteHashtagResponseSchema
} from './features/hashtags/operations/hashtag/delete';
export {
  DeleteHashtagRequestParamsSchema,
  DeleteHashtagResponseSchema
};
export type DeleteHashtagRequestParams = z.infer<typeof DeleteHashtagRequestParamsSchema>;
export type DeleteHashtagResponse = z.infer<typeof DeleteHashtagResponseSchema>;


import {
  FetchHashtagStatsRequestParamsSchema,
  FetchHashtagStatsResponseSchema
} from './features/hashtags/operations/hashtag-stats/fetch-stats';
export {
  FetchHashtagStatsRequestParamsSchema,
  FetchHashtagStatsResponseSchema
};
export type FetchHashtagStatsRequestParams = z.infer<typeof FetchHashtagStatsRequestParamsSchema>;
export type FetchHashtagStatsResponse = z.infer<typeof FetchHashtagStatsResponseSchema>;


import {
  UpdateHashtagStatsRequestBodySchema, UpdateHashtagStatsRequestParamsSchema, UpdateHashtagStatsResponseSchema
} from './features/hashtags/operations/hashtag-stats/update';
export {
  UpdateHashtagStatsRequestBodySchema, UpdateHashtagStatsRequestParamsSchema, UpdateHashtagStatsResponseSchema
};
export type UpdateHashtagStatsRequestBody = z.infer<typeof UpdateHashtagStatsRequestBodySchema>;
export type UpdateHashtagStatsRequestParams = z.infer<typeof UpdateHashtagStatsRequestParamsSchema>;
export type UpdateHashtagStatsResponse = z.infer<typeof UpdateHashtagStatsResponseSchema>;


// Hashtags entities
import { HashtagChannelStatsSchema, HashtagSchema } from './features/hashtags/entity';
export { HashtagChannelStatsSchema, HashtagSchema };
export type HashtagChannelStats = z.infer<typeof HashtagChannelStatsSchema>;
export type Hashtag = z.infer<typeof HashtagSchema>;


// Shoots schemas
import {
  FetchAllShootsRequestBodySchema,
  FetchAllShootsResponseSchema,
  ShootFiltersSchema,
  ShootSummarySchema
} from './features/shoots/operations/shoot/fetch-all';
export {
  FetchAllShootsRequestBodySchema,
  FetchAllShootsResponseSchema,
  ShootFiltersSchema,
  ShootSummarySchema
};
export type FetchAllShootsRequestBody = z.infer<typeof FetchAllShootsRequestBodySchema>;
export type FetchAllShootsResponse = z.infer<typeof FetchAllShootsResponseSchema>;
export type ShootFilters = z.infer<typeof ShootFiltersSchema>;
export type ShootSummary = z.infer<typeof ShootSummarySchema>;


import {
  FetchShootByIdRequestParamsSchema,
  FetchShootByIdResponseSchema
} from './features/shoots/operations/shoot/fetch-by-id';
export {
  FetchShootByIdRequestParamsSchema,
  FetchShootByIdResponseSchema
};
export type FetchShootByIdRequestParams = z.infer<typeof FetchShootByIdRequestParamsSchema>;
export type FetchShootByIdResponse = z.infer<typeof FetchShootByIdResponseSchema>;


import {
  CreateShootRequestBodySchema,
  CreateShootResponseSchema
} from './features/shoots/operations/shoot/create';
export {
  CreateShootRequestBodySchema,
  CreateShootResponseSchema
};
export type CreateShootRequestBody = z.infer<typeof CreateShootRequestBodySchema>;
export type CreateShootResponse = z.infer<typeof CreateShootResponseSchema>;


import {
  UpdateShootRequestBodySchema,
  UpdateShootRequestParamsSchema,
  UpdateShootResponseSchema
} from './features/shoots/operations/shoot/update';
export {
  UpdateShootRequestBodySchema,
  UpdateShootRequestParamsSchema,
  UpdateShootResponseSchema
};
export type UpdateShootRequestBody = z.infer<typeof UpdateShootRequestBodySchema>;
export type UpdateShootRequestParams = z.infer<typeof UpdateShootRequestParamsSchema>;
export type UpdateShootResponse = z.infer<typeof UpdateShootResponseSchema>;


import {
  DeleteShootResponseSchema
} from './features/shoots/operations/shoot/delete';
export {
  DeleteShootResponseSchema
};
export type DeleteShootResponse = z.infer<typeof DeleteShootResponseSchema>;


// Shoots entities
import { ShootSchema } from './features/shoots/entity';
export { ShootSchema };
export type Shoot = z.infer<typeof ShootSchema>;


// Content Schedules schemas
import {
  FetchAllContentSchedulesResponseSchema
} from './features/content-schedules/operations/content-schedule/fetch-all';
export {
  FetchAllContentSchedulesResponseSchema
};
export type FetchAllContentSchedulesResponse = z.infer<typeof FetchAllContentSchedulesResponseSchema>;


import {
  FetchContentScheduleByIdResponseSchema
} from './features/content-schedules/operations/content-schedule/fetch-by-id';
export {
  FetchContentScheduleByIdResponseSchema
};
export type FetchContentScheduleByIdResponse = z.infer<typeof FetchContentScheduleByIdResponseSchema>;


import {
  FetchVirtualPostsRequestQuerySchema,
  FetchVirtualPostsResponseSchema
} from './features/content-schedules/operations/generate-virtual-posts';
export {
  FetchVirtualPostsRequestQuerySchema,
  FetchVirtualPostsResponseSchema
};
export type FetchVirtualPostsRequestQuery = z.infer<typeof FetchVirtualPostsRequestQuerySchema>;
export type FetchVirtualPostsResponse = z.infer<typeof FetchVirtualPostsResponseSchema>;


import {
  ContentScheduleWithChannelSchema,
  FetchContentSchedulesByChannelResponseSchema
} from './features/content-schedules/operations/content-schedule/fetch-by-channel';
export {
  ContentScheduleWithChannelSchema,
  FetchContentSchedulesByChannelResponseSchema
};
export type ContentScheduleWithChannel = z.infer<typeof ContentScheduleWithChannelSchema>;
export type FetchContentSchedulesByChannelResponse = z.infer<typeof FetchContentSchedulesByChannelResponseSchema>;


import {
  CreateContentScheduleRequestBodySchema,
  CreateContentScheduleResponseSchema
} from './features/content-schedules/operations/content-schedule/create';
export {
  CreateContentScheduleRequestBodySchema,
  CreateContentScheduleResponseSchema
};
export type CreateContentScheduleRequestBody = z.infer<typeof CreateContentScheduleRequestBodySchema>;
export type CreateContentScheduleResponse = z.infer<typeof CreateContentScheduleResponseSchema>;


import {
  UpdateContentScheduleRequestBodySchema,
  UpdateContentScheduleResponseSchema
} from './features/content-schedules/operations/content-schedule/update';
export {
  UpdateContentScheduleRequestBodySchema,
  UpdateContentScheduleResponseSchema
};
export type UpdateContentScheduleRequestBody = z.infer<typeof UpdateContentScheduleRequestBodySchema>;
export type UpdateContentScheduleResponse = z.infer<typeof UpdateContentScheduleResponseSchema>;


import {
  DeleteContentScheduleResponseSchema
} from './features/content-schedules/operations/content-schedule/delete';
export {
  DeleteContentScheduleResponseSchema
};
export type DeleteContentScheduleResponse = z.infer<typeof DeleteContentScheduleResponseSchema>;


// Content Schedules entities
import {
  ContentScheduleSchema,
  ContentScheduleTypeSchema,
  ContentScheduleWithSkippedSlotsSchema,
  ContentScheduleWithChannelsSchema,
  ScheduleChannelSchema,
  SkippedScheduleSlotSchema
} from './features/content-schedules/entity';
export {
  ContentScheduleSchema,
  ContentScheduleTypeSchema,
  ContentScheduleWithSkippedSlotsSchema,
  ContentScheduleWithChannelsSchema,
  ScheduleChannelSchema,
  SkippedScheduleSlotSchema
};
export type ContentSchedule = z.infer<typeof ContentScheduleSchema>;
export type ContentScheduleType = z.infer<typeof ContentScheduleTypeSchema>;
export type ContentScheduleWithSkippedSlots = z.infer<typeof ContentScheduleWithSkippedSlotsSchema>;
export type ContentScheduleWithChannels = z.infer<typeof ContentScheduleWithChannelsSchema>;
export type ScheduleChannel = z.infer<typeof ScheduleChannelSchema>;
export type SkippedScheduleSlot = z.infer<typeof SkippedScheduleSlotSchema>;


// Filter Presets schemas
import {
  FetchAllFilterPresetsResponseSchema
} from './features/filter-presets/operations/filter-preset/fetch-all';
export {
  FetchAllFilterPresetsResponseSchema
};
export type FetchAllFilterPresetsResponse = z.infer<typeof FetchAllFilterPresetsResponseSchema>;


import {
  FetchFilterPresetByIdResponseSchema
} from './features/filter-presets/operations/filter-preset/fetch-by-id';
export {
  FetchFilterPresetByIdResponseSchema
};
export type FetchFilterPresetByIdResponse = z.infer<typeof FetchFilterPresetByIdResponseSchema>;


import {
  CreateFilterPresetRequestBodySchema,
  CreateFilterPresetResponseSchema
} from './features/filter-presets/operations/filter-preset/create';
export {
  CreateFilterPresetRequestBodySchema,
  CreateFilterPresetResponseSchema
};
export type CreateFilterPresetRequestBody = z.infer<typeof CreateFilterPresetRequestBodySchema>;
export type CreateFilterPresetResponse = z.infer<typeof CreateFilterPresetResponseSchema>;


import {
  UpdateFilterPresetRequestBodySchema,
  UpdateFilterPresetResponseSchema
} from './features/filter-presets/operations/filter-preset/update';
export {
  UpdateFilterPresetRequestBodySchema,
  UpdateFilterPresetResponseSchema
};
export type UpdateFilterPresetRequestBody = z.infer<typeof UpdateFilterPresetRequestBodySchema>;
export type UpdateFilterPresetResponse = z.infer<typeof UpdateFilterPresetResponseSchema>;


import {
  DeleteFilterPresetResponseSchema
} from './features/filter-presets/operations/filter-preset/delete';
export {
  DeleteFilterPresetResponseSchema
};
export type DeleteFilterPresetResponse = z.infer<typeof DeleteFilterPresetResponseSchema>;


// Filter Presets entities
import { FilterPresetSchema } from './features/filter-presets/entity';
export { FilterPresetSchema };
export type FilterPreset = z.infer<typeof FilterPresetSchema>;


// Snippets schemas
import {
  FetchAllSnippetsResponseSchema
} from './features/snippets/operations/snippet/fetch-all';
export {
  FetchAllSnippetsResponseSchema
};
export type FetchAllSnippetsResponse = z.infer<typeof FetchAllSnippetsResponseSchema>;


import {
  FetchGlobalSnippetsResponseSchema
} from './features/snippets/operations/snippet/fetch-global';
export {
  FetchGlobalSnippetsResponseSchema
};
export type FetchGlobalSnippetsResponse = z.infer<typeof FetchGlobalSnippetsResponseSchema>;


import {
  FetchSnippetsByChannelRequestParamsSchema,
  FetchSnippetsByChannelResponseSchema
} from './features/snippets/operations/snippet/fetch-by-channel';
export {
  FetchSnippetsByChannelRequestParamsSchema,
  FetchSnippetsByChannelResponseSchema
};
export type FetchSnippetsByChannelRequestParams = z.infer<typeof FetchSnippetsByChannelRequestParamsSchema>;
export type FetchSnippetsByChannelResponse = z.infer<typeof FetchSnippetsByChannelResponseSchema>;


import {
  FetchSnippetByIdRequestParamsSchema,
  FetchSnippetByIdResponseSchema
} from './features/snippets/operations/snippet/fetch-by-id';
export {
  FetchSnippetByIdRequestParamsSchema,
  FetchSnippetByIdResponseSchema
};
export type FetchSnippetByIdRequestParams = z.infer<typeof FetchSnippetByIdRequestParamsSchema>;
export type FetchSnippetByIdResponse = z.infer<typeof FetchSnippetByIdResponseSchema>;


import {
  CreateSnippetRequestBodySchema,
  CreateSnippetResponseSchema
} from './features/snippets/operations/snippet/create';
export {
  CreateSnippetRequestBodySchema,
  CreateSnippetResponseSchema
};
export type CreateSnippetRequestBody = z.infer<typeof CreateSnippetRequestBodySchema>;
export type CreateSnippetResponse = z.infer<typeof CreateSnippetResponseSchema>;


import {
  UpdateSnippetRequestBodySchema, UpdateSnippetRequestParamsSchema, UpdateSnippetResponseSchema
} from './features/snippets/operations/snippet/update';
export {
  UpdateSnippetRequestBodySchema, UpdateSnippetRequestParamsSchema, UpdateSnippetResponseSchema
};
export type UpdateSnippetRequestBody = z.infer<typeof UpdateSnippetRequestBodySchema>;
export type UpdateSnippetRequestParams = z.infer<typeof UpdateSnippetRequestParamsSchema>;
export type UpdateSnippetResponse = z.infer<typeof UpdateSnippetResponseSchema>;


import {
  DeleteSnippetRequestParamsSchema,
  DeleteSnippetResponseSchema
} from './features/snippets/operations/snippet/delete';
export {
  DeleteSnippetRequestParamsSchema,
  DeleteSnippetResponseSchema
};
export type DeleteSnippetRequestParams = z.infer<typeof DeleteSnippetRequestParamsSchema>;
export type DeleteSnippetResponse = z.infer<typeof DeleteSnippetResponseSchema>;


// Snippets entities
import { CaptionSnippetSchema } from './features/snippets/entity';
export { CaptionSnippetSchema };
export type CaptionSnippet = z.infer<typeof CaptionSnippetSchema>;


// Settings schemas
import {
  LoadSettingsResponseSchema,
  type LoadSettingsResponse,
} from './features/settings/operations/setting/load';
export {
  LoadSettingsResponseSchema,
  type LoadSettingsResponse,
};


import {
  SaveSettingsRequestBodySchema,
  SaveSettingsResponseSchema,
  type SaveSettingsRequestBody,
  type SaveSettingsResponse,
} from './features/settings/operations/setting/save';
export {
  SaveSettingsRequestBodySchema,
  SaveSettingsResponseSchema,
  type SaveSettingsRequestBody,
  type SaveSettingsResponse,
};


import {
  ToggleSfwModeResponseSchema,
  type ToggleSfwModeResponse,
} from './features/settings/operations/setting/toggle-sfw';
export {
  ToggleSfwModeResponseSchema,
  type ToggleSfwModeResponse,
};


import {
  FanslyCredentialsSchema,
  LoadFanslyCredentialsResponseSchema,
  type LoadFanslyCredentialsResponse,
} from './features/settings/operations/credentials/load';
export {
  FanslyCredentialsSchema,
  LoadFanslyCredentialsResponseSchema,
  type LoadFanslyCredentialsResponse,
};
export type FanslyCredentials = z.infer<typeof FanslyCredentialsSchema>;


import {
  SaveFanslyCredentialsRequestBodySchema,
  SaveFanslyCredentialsResponseSchema,
  type SaveFanslyCredentialsRequestBody,
  type SaveFanslyCredentialsResponse,
} from './features/settings/operations/credentials/save';
export {
  SaveFanslyCredentialsRequestBodySchema,
  SaveFanslyCredentialsResponseSchema,
  type SaveFanslyCredentialsRequestBody,
  type SaveFanslyCredentialsResponse,
};


import {
  ClearFanslyCredentialsResponseSchema,
  type ClearFanslyCredentialsResponse,
} from './features/settings/operations/credentials/clear';
export {
  ClearFanslyCredentialsResponseSchema,
  type ClearFanslyCredentialsResponse,
};


// Settings entities
import { SettingsSchema, type Settings } from './features/settings/schemas/settings';
export { SettingsSchema, type Settings };


// Postpone schemas
import {
  DraftBlueskyPostRequestBodySchema,
  DraftBlueskyPostResponseSchema
} from './features/api-postpone/operations/bluesky/draft';
export {
  DraftBlueskyPostRequestBodySchema,
  DraftBlueskyPostResponseSchema
};
export type DraftBlueskyPostRequestBody = z.infer<typeof DraftBlueskyPostRequestBodySchema>;
export type DraftBlueskyPostResponse = z.infer<typeof DraftBlueskyPostResponseSchema>;


import {
  FindRedgifsURLRequestBodySchema,
  FindRedgifsURLResponseSchema
} from './features/api-postpone/operations/redgifs/find-url';
export {
  FindRedgifsURLRequestBodySchema,
  FindRedgifsURLResponseSchema
};
export type FindRedgifsURLRequestBody = z.infer<typeof FindRedgifsURLRequestBodySchema>;
export type FindRedgifsURLResponse = z.infer<typeof FindRedgifsURLResponseSchema>;


import {
  RefreshRedgifsURLRequestBodySchema,
  RefreshRedgifsURLResponseSchema
} from './features/api-postpone/operations/redgifs/refresh-url';
export {
  RefreshRedgifsURLRequestBodySchema,
  RefreshRedgifsURLResponseSchema
};
export type RefreshRedgifsURLRequestBody = z.infer<typeof RefreshRedgifsURLRequestBodySchema>;
export type RefreshRedgifsURLResponse = z.infer<typeof RefreshRedgifsURLResponseSchema>;


import {
  FindSubredditPostingTimesRequestBodySchema,
  FindSubredditPostingTimesResponseSchema
} from './features/api-postpone/operations/subreddit/find-posting-times';
export {
  FindSubredditPostingTimesRequestBodySchema,
  FindSubredditPostingTimesResponseSchema
};
export type FindSubredditPostingTimesRequestBody = z.infer<typeof FindSubredditPostingTimesRequestBodySchema>;
export type FindSubredditPostingTimesResponse = z.infer<typeof FindSubredditPostingTimesResponseSchema>;


// Postpone entities
import { SubredditPostingTimeSchema } from './features/api-postpone/schemas/subreddit-posting-time';
export { SubredditPostingTimeSchema };
export type SubredditPostingTime = z.infer<typeof SubredditPostingTimeSchema>;


// Analytics schemas
import {
  GetFanslyPostsWithAnalyticsQuerySchema,
  GetFanslyPostsWithAnalyticsResponseSchema
} from './features/analytics/operations/post-analytics/fetch-posts-with-analytics';
export {
  GetFanslyPostsWithAnalyticsQuerySchema,
  GetFanslyPostsWithAnalyticsResponseSchema
};
export type GetFanslyPostsWithAnalyticsQuery = Static<typeof GetFanslyPostsWithAnalyticsQuerySchema>;
export type GetFanslyPostsWithAnalyticsResponse = Static<typeof GetFanslyPostsWithAnalyticsResponseSchema>;


import {
  GetHashtagAnalyticsResponseSchema
} from './features/analytics/operations/post-analytics/fetch-hashtag-analytics';
export {
  GetHashtagAnalyticsResponseSchema
};
export type GetHashtagAnalyticsResponse = Static<typeof GetHashtagAnalyticsResponseSchema>;


import {
  GetTimeAnalyticsResponseSchema
} from './features/analytics/operations/post-analytics/fetch-time-analytics';
export {
  GetTimeAnalyticsResponseSchema
};
export type GetTimeAnalyticsResponse = Static<typeof GetTimeAnalyticsResponseSchema>;


import {
  GenerateInsightsResponseSchema
} from './features/analytics/operations/insights';
export {
  GenerateInsightsResponseSchema
};
export type GenerateInsightsResponse = Static<typeof GenerateInsightsResponseSchema>;


// Analytics entities
import {
  FanslyPostWithAnalyticsSchema, HashtagAnalyticsItemSchema, HashtagAnalyticsSchema, TimeAnalyticsItemSchema, TimeAnalyticsSchema
} from './features/analytics/schemas/analytics';
export {
  FanslyPostWithAnalyticsSchema, HashtagAnalyticsItemSchema, HashtagAnalyticsSchema, TimeAnalyticsItemSchema, TimeAnalyticsSchema
};
export type FanslyPostWithAnalytics = Static<typeof FanslyPostWithAnalyticsSchema>;
export type HashtagAnalyticsItem = Static<typeof HashtagAnalyticsItemSchema>;
export type HashtagAnalytics = Static<typeof HashtagAnalyticsSchema>;
export type TimeAnalyticsItem = Static<typeof TimeAnalyticsItemSchema>;
export type TimeAnalytics = Static<typeof TimeAnalyticsSchema>;


import {
  ActionableInsightSchema, ActionableInsightTypeSchema, ContentThemeInsightSchema, HashtagInsightSchema, PostTimingInsightSchema, VideoLengthInsightSchema
} from './features/analytics/schemas/insights';
export {
  ActionableInsightSchema, ActionableInsightTypeSchema, ContentThemeInsightSchema, HashtagInsightSchema, PostTimingInsightSchema, VideoLengthInsightSchema
};
export type ActionableInsight = Static<typeof ActionableInsightSchema>;
export type ActionableInsightType = Static<typeof ActionableInsightTypeSchema>;
export type ContentThemeInsight = Static<typeof ContentThemeInsightSchema>;
export type HashtagInsight = Static<typeof HashtagInsightSchema>;
export type PostTimingInsight = Static<typeof PostTimingInsightSchema>;
export type VideoLengthInsight = Static<typeof VideoLengthInsightSchema>;


import {
  AnalyticsHealthResponseSchema,
  StalePostSchema
} from './features/analytics/schemas/health';
export {
  AnalyticsHealthResponseSchema,
  StalePostSchema
};
export type AnalyticsHealthResponse = Static<typeof AnalyticsHealthResponseSchema>;
export type StalePost = Static<typeof StalePostSchema>;


import {
  FypActionsQuerySchema,
  FypActionsResponseSchema,
  FypPostSchema
} from './features/analytics/schemas/fyp-actions';
export {
  FypActionsQuerySchema,
  FypActionsResponseSchema,
  FypPostSchema
};
export type FypActionsQuery = Static<typeof FypActionsQuerySchema>;
export type FypActionsResponse = Static<typeof FypActionsResponseSchema>;
export type FypPost = Static<typeof FypPostSchema>;


// Analytics Candidates schemas
import {
  FetchAllCandidatesRequestQuerySchema,
  FetchAllCandidatesResponseSchema,
  CreateCandidatesRequestBodySchema,
  CreateCandidatesResponseSchema,
  ConfirmMatchRequestBodySchema,
  ConfirmMatchRequestParamsSchema,
  ConfirmMatchResponseSchema,
  IgnoreCandidateRequestParamsSchema,
  IgnoreCandidateResponseSchema,
  UnmatchCandidateRequestParamsSchema,
  UnmatchCandidateResponseSchema,
  UnignoreCandidateRequestParamsSchema,
  UnignoreCandidateResponseSchema,
  BulkConfirmCandidatesRequestBodySchema,
  BulkConfirmCandidatesResponseSchema,
  FetchCandidateSuggestionsRequestParamsSchema,
  FetchCandidateSuggestionsResponseSchema,
  FanslyMediaCandidateSchema,
  CreateCandidateSchema,
  MatchSuggestionSchema,
  CandidateStatusSchema,
  MatchMethodSchema,
  FanslyMediaTypeSchema,
} from './features/analytics/candidates/schema';
export {
  FetchAllCandidatesRequestQuerySchema,
  FetchAllCandidatesResponseSchema,
  CreateCandidatesRequestBodySchema,
  CreateCandidatesResponseSchema,
  ConfirmMatchRequestBodySchema,
  ConfirmMatchRequestParamsSchema,
  ConfirmMatchResponseSchema,
  IgnoreCandidateRequestParamsSchema,
  IgnoreCandidateResponseSchema,
  UnmatchCandidateRequestParamsSchema,
  UnmatchCandidateResponseSchema,
  UnignoreCandidateRequestParamsSchema,
  UnignoreCandidateResponseSchema,
  BulkConfirmCandidatesRequestBodySchema,
  BulkConfirmCandidatesResponseSchema,
  FetchCandidateSuggestionsRequestParamsSchema,
  FetchCandidateSuggestionsResponseSchema,
  FanslyMediaCandidateSchema,
  CreateCandidateSchema,
  MatchSuggestionSchema,
  CandidateStatusSchema,
  MatchMethodSchema,
  FanslyMediaTypeSchema,
};
export type FetchAllCandidatesRequestQuery = z.infer<typeof FetchAllCandidatesRequestQuerySchema>;
export type FetchAllCandidatesResponse = z.infer<typeof FetchAllCandidatesResponseSchema>;
export type CreateCandidatesRequestBody = z.infer<typeof CreateCandidatesRequestBodySchema>;
export type CreateCandidatesResponse = z.infer<typeof CreateCandidatesResponseSchema>;
export type ConfirmMatchRequestBody = z.infer<typeof ConfirmMatchRequestBodySchema>;
export type ConfirmMatchRequestParams = z.infer<typeof ConfirmMatchRequestParamsSchema>;
export type ConfirmMatchResponse = z.infer<typeof ConfirmMatchResponseSchema>;
export type IgnoreCandidateRequestParams = z.infer<typeof IgnoreCandidateRequestParamsSchema>;
export type IgnoreCandidateResponse = z.infer<typeof IgnoreCandidateResponseSchema>;
export type UnmatchCandidateRequestParams = z.infer<typeof UnmatchCandidateRequestParamsSchema>;
export type UnmatchCandidateResponse = z.infer<typeof UnmatchCandidateResponseSchema>;
export type UnignoreCandidateRequestParams = z.infer<typeof UnignoreCandidateRequestParamsSchema>;
export type UnignoreCandidateResponse = z.infer<typeof UnignoreCandidateResponseSchema>;
export type BulkConfirmCandidatesRequestBody = z.infer<typeof BulkConfirmCandidatesRequestBodySchema>;
export type BulkConfirmCandidatesResponse = z.infer<typeof BulkConfirmCandidatesResponseSchema>;
export type FetchCandidateSuggestionsRequestParams = z.infer<typeof FetchCandidateSuggestionsRequestParamsSchema>;
export type FetchCandidateSuggestionsResponse = z.infer<typeof FetchCandidateSuggestionsResponseSchema>;
export type FanslyMediaCandidate = z.infer<typeof FanslyMediaCandidateSchema>;
export type CreateCandidate = z.infer<typeof CreateCandidateSchema>;
export type MatchSuggestion = z.infer<typeof MatchSuggestionSchema>;
export type CandidateStatus = z.infer<typeof CandidateStatusSchema>;
export type MatchMethod = z.infer<typeof MatchMethodSchema>;
export type FanslyMediaType = z.infer<typeof FanslyMediaTypeSchema>;


// Reddit Automation schemas
import {
  IsRunningResponseSchema,
  GenerateRandomPostRequestBodySchema,
  GenerateRandomPostResponseSchema,
  GeneratePostsRequestBodySchema,
  GeneratePostsResponseSchema,
  RegenerateMediaRequestBodySchema,
  RegenerateMediaResponseSchema,
  SchedulePostsRequestBodySchema,
  SchedulePostsResponseSchema,
  GetScheduledPostsResponseSchema,
  PostToRedditRequestBodySchema,
  PostToRedditResponseSchema,
  LoginRequestBodySchema,
  LoginResponseSchema,
  CheckLoginRequestBodySchema,
  CheckLoginResponseSchema,
  SessionStatusRequestBodySchema,
  SessionStatusResponseSchema,
  ClearSessionRequestBodySchema,
  ClearSessionResponseSchema
} from './features/reddit-automation/schema';
export {
  IsRunningResponseSchema,
  GenerateRandomPostRequestBodySchema,
  GenerateRandomPostResponseSchema,
  GeneratePostsRequestBodySchema,
  GeneratePostsResponseSchema,
  RegenerateMediaRequestBodySchema,
  RegenerateMediaResponseSchema,
  SchedulePostsRequestBodySchema,
  SchedulePostsResponseSchema,
  GetScheduledPostsResponseSchema,
  PostToRedditRequestBodySchema,
  PostToRedditResponseSchema,
  LoginRequestBodySchema,
  LoginResponseSchema,
  CheckLoginRequestBodySchema,
  CheckLoginResponseSchema,
  SessionStatusRequestBodySchema,
  SessionStatusResponseSchema,
  ClearSessionRequestBodySchema,
  ClearSessionResponseSchema
};
export type IsRunningResponse = z.infer<typeof IsRunningResponseSchema>;
export type GenerateRandomPostRequestBody = z.infer<typeof GenerateRandomPostRequestBodySchema>;
export type GenerateRandomPostResponse = z.infer<typeof GenerateRandomPostResponseSchema>;
export type GeneratePostsRequestBody = z.infer<typeof GeneratePostsRequestBodySchema>;
export type GeneratePostsResponse = z.infer<typeof GeneratePostsResponseSchema>;
export type RegenerateMediaRequestBody = z.infer<typeof RegenerateMediaRequestBodySchema>;
export type RegenerateMediaResponse = z.infer<typeof RegenerateMediaResponseSchema>;
export type SchedulePostsRequestBody = z.infer<typeof SchedulePostsRequestBodySchema>;
export type SchedulePostsResponse = z.infer<typeof SchedulePostsResponseSchema>;
export type GetScheduledPostsResponse = z.infer<typeof GetScheduledPostsResponseSchema>;
export type PostToRedditRequestBody = z.infer<typeof PostToRedditRequestBodySchema>;
export type PostToRedditResponse = z.infer<typeof PostToRedditResponseSchema>;
export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type CheckLoginRequestBody = z.infer<typeof CheckLoginRequestBodySchema>;
export type CheckLoginResponse = z.infer<typeof CheckLoginResponseSchema>;
export type SessionStatusRequestBody = z.infer<typeof SessionStatusRequestBodySchema>;
export type SessionStatusResponse = z.infer<typeof SessionStatusResponseSchema>;
export type ClearSessionRequestBody = z.infer<typeof ClearSessionRequestBodySchema>;
export type ClearSessionResponse = z.infer<typeof ClearSessionResponseSchema>;

