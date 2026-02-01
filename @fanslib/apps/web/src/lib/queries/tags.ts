import type { AssignTagsToMediaRequestBody, BulkAssignTagsRequestBody, CreateTagDefinitionRequestBody, CreateTagDimensionRequestBody, DeleteTagDefinitionParams, DeleteTagDimensionParams, FetchMediaTagsRequestParams, FetchMediaTagsRequestQuery, FetchTagDefinitionByIdRequestParams, FetchTagDefinitionsByIdsRequestQuery, FetchTagDimensionByIdRequestParams, FetchTagsByDimensionQuery, RemoveTagsFromMediaRequestBody, RemoveTagsFromMediaRequestParams, UpdateTagDefinitionParams, UpdateTagDefinitionRequestBody, UpdateTagDimensionParams, UpdateTagDimensionRequestBody } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

// Tag Dimensions
export const useTagDimensionsQuery = () =>
  useQuery({
    queryKey: ['tags', 'dimensions'],
    queryFn: async () => {
      const result = await api.api.tags.dimensions.$get();
      return result.json();
    },
  });

export const useTagDimensionQuery = (params: FetchTagDimensionByIdRequestParams) =>
  useQuery({
    queryKey: ['tags', 'dimensions', params.id],
    queryFn: async () => {
      const result = await api.api.tags.dimensions[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useCreateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagDimensionRequestBody) => {
      const result = await api.api.tags.dimensions.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
    },
  });
};

type UpdateTagDimensionInput = UpdateTagDimensionParams & {
  updates: UpdateTagDimensionRequestBody;
};

export const useUpdateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTagDimensionInput) => {
      const result = await api.api.tags.dimensions[':id'].$patch({ param: { id }, json: updates });
      return result.json();
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
    mutationFn: async (params: DeleteTagDimensionParams) => {
      const result = await api.api.tags.dimensions[':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
    },
  });
};

// Tag Definitions
export const useTagDefinitionsByDimensionQuery = (query: FetchTagsByDimensionQuery) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-dimension', query.dimensionId],
    queryFn: async () => {
      const result = await api.api.tags.definitions.$get(query);
      return result.json();
    },
    enabled: !!query.dimensionId,
  });

export const useTagDefinitionQuery = (params: FetchTagDefinitionByIdRequestParams) =>
  useQuery({
    queryKey: ['tags', 'definitions', params.id],
    queryFn: async () => {
      const result = await api.api.tags.definitions[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useTagDefinitionsByIdsQuery = (query: FetchTagDefinitionsByIdsRequestQuery) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-ids', query.ids],
    queryFn: async () => {
      const result = await api.api.tags.definitions['by-ids'].$get({ ids: query.ids });
      return result.json();
    },
    enabled: query.ids.length > 0,
  });

export const useCreateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagDefinitionRequestBody) => {
      const result = await api.api.tags.definitions.$post({ json: data });
      return result.json();
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
            tags: [...(dimension.tags ?? []), data],
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

type UpdateTagDefinitionInput = UpdateTagDefinitionParams & {
  updates: UpdateTagDefinitionRequestBody;
};

export const useUpdateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTagDefinitionInput) => {
      const result = await api.api.tags.definitions[':id'].$patch({ param: { id }, json: updates });
      return result.json();
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
    mutationFn: async (params: DeleteTagDefinitionParams) => {
      const result = await api.api.tags.definitions[':id'].$delete({ param: { id: params.id } });
      return result.json();
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
  params: FetchMediaTagsRequestParams,
  query?: FetchMediaTagsRequestQuery
) =>
  useQuery({
    queryKey: ['tags', 'media', params.mediaId, query?.dimensionId],
    queryFn: async () => {
      const result = await api.api.tags.media['by-media-id'][':mediaId'].$get({ 
        param: { mediaId: params.mediaId },
        query: query 
      });
      return result.json();
    },
    enabled: !!params.mediaId,
  });

export const useBulkMediaTagsQuery = (mediaIds: string[], dimensionId?: number) =>
  useQuery({
    queryKey: ['tags', 'media', 'bulk', mediaIds, dimensionId],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];

      const tagPromises = mediaIds.map(async (mediaId) => {
        const result = await api.api.tags.media['by-media-id'][':mediaId'].$get({
          param: { mediaId },
          query: dimensionId ? { dimensionId } : undefined,
        });
        return result.json();
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
        const result = await api.api.tags.media['by-media-id'][':mediaId'].$get({ param: { mediaId } });
        return result.json();
      });
      const results = await Promise.all(tagPromises);
      return results.flat();
    },
    enabled: mediaIds.length > 0,
  });

export const useAssignTagsToMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignTagsToMediaRequestBody) => {
      const result = await api.api.tags.media['assign'].$post({ json: data });
      return result.json();
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
    mutationFn: async (data: BulkAssignTagsRequestBody) => {
      const result = await api.api.tags.media['assign-bulk'].$post({ json: data });
      return result.json();
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

type RemoveTagsFromMediaParams = RemoveTagsFromMediaRequestParams & RemoveTagsFromMediaRequestBody;

export const useRemoveTagsFromMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, tagIds }: RemoveTagsFromMediaParams) => {
      const result = await api.api.tags.media['by-media-id'][':mediaId'].$delete({ 
        param: { mediaId },
        json: { tagIds }
      });
      return result.json();
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
      const result = await api.api.tags['drift-prevention'].stats.$get();
      return result.json();
    },
  });

export const usePerformCleanupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await api.api.tags['drift-prevention'].cleanup.$post();
      return result.json();
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
      const result = await api.api.tags['drift-prevention']['sync-sticker-display'].$post();
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'drift-prevention', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};
