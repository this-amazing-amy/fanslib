import { z } from 'zod/v4';
import {
  selectChannelSchema,
  selectContentScheduleSchema,
  selectFilterPresetSchema,
  selectHashtagSchema,
  selectMediaSchema,
  selectMediaTagSchema,
  selectPostSchema,
  selectShootSchema,
  selectSnippetSchema,
  selectSubredditSchema,
  selectTagDefinitionSchema,
  selectTagDimensionSchema,
} from './schema';

// Collection schemas that work for both insert and select operations
// by making auto-generated fields optional

export const mediaCollectionSchema = selectMediaSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const shootCollectionSchema = selectShootSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const postCollectionSchema = selectPostSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const channelCollectionSchema = selectChannelSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const subredditCollectionSchema = selectSubredditSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const tagDimensionCollectionSchema = selectTagDimensionSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const tagDefinitionCollectionSchema = selectTagDefinitionSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const mediaTagCollectionSchema = selectMediaTagSchema.partial({
  id: true,
  assignedAt: true,
});

export const contentScheduleCollectionSchema =
  selectContentScheduleSchema.partial({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const snippetCollectionSchema = selectSnippetSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const hashtagCollectionSchema = selectHashtagSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const filterPresetCollectionSchema = selectFilterPresetSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MediaCollection = z.infer<typeof mediaCollectionSchema>;
export type ShootCollection = z.infer<typeof shootCollectionSchema>;
export type PostCollection = z.infer<typeof postCollectionSchema>;
export type ChannelCollection = z.infer<typeof channelCollectionSchema>;
export type SubredditCollection = z.infer<typeof subredditCollectionSchema>;
export type TagDimensionCollection = z.infer<typeof tagDimensionCollectionSchema>;
export type TagDefinitionCollection = z.infer<typeof tagDefinitionCollectionSchema>;
export type MediaTagCollection = z.infer<typeof mediaTagCollectionSchema>;
export type ContentScheduleCollection = z.infer<typeof contentScheduleCollectionSchema>;
export type SnippetCollection = z.infer<typeof snippetCollectionSchema>;
export type HashtagCollection = z.infer<typeof hashtagCollectionSchema>;
export type FilterPresetCollection = z.infer<typeof filterPresetCollectionSchema>;
