import type {
  AssignTagsToMediaRequestBodySchema,
  BulkAssignTagsRequestBodySchema,
  CreateTagDefinitionRequestBodySchema,
  CreateTagDimensionRequestBodySchema,
  DeleteTagDefinitionParamsSchema,
  DeleteTagDimensionParamsSchema,
  FetchMediaTagsRequestParamsSchema,
  FetchMediaTagsRequestQuerySchema,
  FetchTagDefinitionByIdRequestParamsSchema,
  FetchTagDefinitionsByIdsRequestQuerySchema,
  FetchTagDimensionByIdRequestParamsSchema,
  FetchTagsByDimensionQuerySchema,
  RemoveTagsFromMediaRequestBodySchema,
  RemoveTagsFromMediaRequestParamsSchema,
  UpdateTagDefinitionParamsSchema,
  UpdateTagDefinitionRequestBodySchema,
  UpdateTagDimensionParamsSchema,
  UpdateTagDimensionRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

// Tag Dimensions
export const useTagDimensionsQuery = () =>
  useQuery({
    queryKey: ['tags', 'dimensions'],
    queryFn: async () => {
      const result = await eden.api.tags.dimensions.get();
      return result.data;
    },
  });

export const useTagDimensionQuery = (params: typeof FetchTagDimensionByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['tags', 'dimensions', params.id],
    queryFn: async () => {
      const result = await eden.api.tags.dimensions['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useCreateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateTagDimensionRequestBodySchema.static) => {
      const result = await eden.api.tags.dimensions.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
    },
  });
};

type UpdateTagDimensionParams = typeof UpdateTagDimensionParamsSchema.static & {
  updates: typeof UpdateTagDimensionRequestBodySchema.static;
};

export const useUpdateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTagDimensionParams) => {
      const result = await eden.api.tags.dimensions['by-id']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.setQueryData(['tags', 'dimensions', variables.id], data);
    },
  });
};

export const useDeleteTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: typeof DeleteTagDimensionParamsSchema.static) => {
      const result = await eden.api.tags.dimensions['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
    },
  });
};

// Tag Definitions
export const useTagDefinitionsByDimensionQuery = (query: typeof FetchTagsByDimensionQuerySchema.static) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-dimension', query.dimensionId],
    queryFn: async () => {
      const result = await eden.api.tags.definitions.get({ query: query });
      return result.data;
    },
    enabled: !!query.dimensionId,
  });

export const useTagDefinitionQuery = (params: typeof FetchTagDefinitionByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['tags', 'definitions', params.id],
    queryFn: async () => {
      const result = await eden.api.tags.definitions['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useTagDefinitionsByIdsQuery = (query: typeof FetchTagDefinitionsByIdsRequestQuerySchema.static) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-ids', query.ids],
    queryFn: async () => {
      const result = await eden.api.tags.definitions['by-ids'].get({ query: { ids: query.ids } });
      return result.data;
    },
    enabled: query.ids.length > 0,
  });

export const useCreateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateTagDefinitionRequestBodySchema.static) => {
      const result = await eden.api.tags.definitions.post(data);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });

      // Optimistically add the new tag to the dimensions cache
      queryClient.setQueryData(['tags', 'dimensions'], (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData) || !data) return oldData;

        return oldData.map(dimension => {
          if (dimension.id !== data.dimensionId) return dimension;

          return {
            ...dimension,
            tags: [...(dimension.tags || []), data],
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.invalidateQueries({
        queryKey: ['tags', 'definitions', 'by-dimension', data?.dimensionId],
      });
    },
  });
};

type UpdateTagDefinitionParams = typeof UpdateTagDefinitionParamsSchema.static & {
  updates: typeof UpdateTagDefinitionRequestBodySchema.static;
};

export const useUpdateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTagDefinitionParams) => {
      const result = await eden.api.tags.definitions['by-id']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });

      // Optimistically update the dimensions cache with the updated tag
      queryClient.setQueryData(['tags', 'dimensions'], (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        return oldData.map(dimension => {
          if (!dimension.tags) return dimension;

          return {
            ...dimension,
            tags: dimension.tags.map((tag: { id: number }) =>
              tag.id === Number(variables.id) ? data : tag
            ),
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.setQueryData(['tags', 'definitions', variables.id], data);
      queryClient.invalidateQueries({
        queryKey: ['tags', 'definitions', 'by-dimension', data?.dimensionId],
      });
    },
  });
};

export const useDeleteTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: typeof DeleteTagDefinitionParamsSchema.static) => {
      const result = await eden.api.tags.definitions['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};

// Media Tags
export const useMediaTagsQuery = (
  params: typeof FetchMediaTagsRequestParamsSchema.static,
  query?: typeof FetchMediaTagsRequestQuerySchema.static
) =>
  useQuery({
    queryKey: ['tags', 'media', params.mediaId, query?.dimensionId],
    queryFn: async () => {
      const result = await eden.api.tags.media['by-media-id']({ mediaId: params.mediaId }).get({ query: query });
      return result.data;
    },
    enabled: !!params.mediaId,
  });

export const useBulkMediaTagsQuery = (mediaIds: string[], dimensionId?: number) =>
  useQuery({
    queryKey: ['tags', 'media', 'bulk', mediaIds, dimensionId],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];

      const tagPromises = mediaIds.map(async (mediaId) => {
        const result = await eden.api.tags.media['by-media-id']({ mediaId }).get({
          query: dimensionId ? { dimensionId } : undefined,
        });
        return result.data;
      });
      const results = await Promise.all(tagPromises);
      return results.flat();
    },
    enabled: mediaIds.length > 0,
  });

export const useTagsForMediasQuery = (mediaIds: string[]) =>
  useQuery({
    queryKey: ['tags', 'media', 'for-medias', mediaIds],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];

      const tagPromises = mediaIds.map(async (mediaId) => {
        const result = await eden.api.tags.media['by-media-id']({ mediaId }).get();
        return result.data;
      });
      const results = await Promise.all(tagPromises);
      return results.flat();
    },
    enabled: mediaIds.length > 0,
  });

export const useAssignTagsToMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof AssignTagsToMediaRequestBodySchema.static) => {
      const result = await eden.api.tags.media['assign'].post(data);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', variables.mediaId] });
      queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
    },
  });
};

export const useBulkAssignTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof BulkAssignTagsRequestBodySchema.static) => {
      const result = await eden.api.tags.media['assign-bulk'].post(data);
      return result.data;
    },
    onSuccess: (_, variables) => {
      variables.forEach((assignment) => {
        queryClient.invalidateQueries({ queryKey: ['tags', 'media', assignment.mediaId] });
        queryClient.invalidateQueries({ queryKey: ['media', assignment.mediaId] });
      });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', 'bulk'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};

type RemoveTagsFromMediaParams = typeof RemoveTagsFromMediaRequestParamsSchema.static & typeof RemoveTagsFromMediaRequestBodySchema.static;

export const useRemoveTagsFromMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, tagIds }: RemoveTagsFromMediaParams) => {
      const result = await eden.api.tags.media['by-media-id']({ mediaId }).delete({ tagIds });
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', variables.mediaId] });
      queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', 'bulk'] });
    },
  });
};

// Drift Prevention
export const useDriftPreventionStatsQuery = () =>
  useQuery({
    queryKey: ['tags', 'drift-prevention', 'stats'],
    queryFn: async () => {
      const result = await eden.api.tags['drift-prevention'].stats.get();
      return result.data;
    },
  });

export const usePerformCleanupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await eden.api.tags['drift-prevention'].cleanup.post();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'drift-prevention', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};

export const useSyncStickerDisplayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await eden.api.tags['drift-prevention']['sync-sticker-display'].post();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'drift-prevention', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};
