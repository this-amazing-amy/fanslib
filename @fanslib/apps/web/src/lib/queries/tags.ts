import type { AssignTagsToMediaRequestBody, BulkAssignTagsRequestBody, CreateTagDefinitionRequestBody, CreateTagDimensionRequestBody, DeleteTagDefinitionParams, DeleteTagDimensionParams, FetchMediaTagsRequestParams, FetchMediaTagsRequestQuery, FetchTagDefinitionByIdRequestParams, FetchTagDefinitionsByIdsRequestQuery, FetchTagDimensionByIdRequestParams, FetchTagsByDimensionQuery, RemoveTagsFromMediaRequestBody, RemoveTagsFromMediaRequestParams, UpdateTagDefinitionParams, UpdateTagDefinitionRequestBody, UpdateTagDimensionParams, UpdateTagDimensionRequestBody } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

// Tag Dimensions
export const useTagDimensionsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.tags.dimensions.all(),
    queryFn: async () => {
      const result = await api.api.tags.dimensions.$get();
      return result.json();
    },
  });

export const useTagDimensionQuery = (params: FetchTagDimensionByIdRequestParams) =>
  useQuery({
    queryKey: QUERY_KEYS.tags.dimensions.byId(params.id),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
      queryClient.setQueryData(QUERY_KEYS.tags.dimensions.byId(variables.id), data);
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.definitions.all() });
    },
  });
};

// Tag Definitions
export const useTagDefinitionsByDimensionQuery = (query: FetchTagsByDimensionQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.tags.definitions.byDimension(query),
    queryFn: async () => {
      const result = await api.api.tags.definitions.$get(query);
      return result.json();
    },
    enabled: !!query.dimensionId,
  });

export const useTagDefinitionQuery = (params: FetchTagDefinitionByIdRequestParams) =>
  useQuery({
    queryKey: QUERY_KEYS.tags.definitions.byId(params.id),
    queryFn: async () => {
      const result = await api.api.tags.definitions[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useTagDefinitionsByIdsQuery = (query: FetchTagDefinitionsByIdsRequestQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.tags.definitions.byIds(query),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.definitions.all() });

      // Optimistically add the new tag to the dimensions cache
      queryClient.setQueryData(QUERY_KEYS.tags.dimensions.all(), (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData) || !data) return oldData;

        return oldData.map(dimension => {
          if (dimension.id !== data.dimensionId) return dimension;

          return {
            ...dimension,
            tags: [...(dimension.tags ?? []), data],
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
      if (data?.dimensionId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.tags.definitions.byDimension({ dimensionId: data.dimensionId }),
        });
      }
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.definitions.all() });

      // Optimistically update the dimensions cache with the updated tag
      queryClient.setQueryData(QUERY_KEYS.tags.dimensions.all(), (oldData: unknown) => {
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

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
      queryClient.setQueryData(QUERY_KEYS.tags.definitions.byId(variables.id), data);
      if (data?.dimensionId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.tags.definitions.byDimension({ dimensionId: data.dimensionId }),
        });
      }
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.definitions.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.dimensions.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.all() });
    },
  });
};

// Media Tags
export const useMediaTagsQuery = (
  params: FetchMediaTagsRequestParams,
  query?: FetchMediaTagsRequestQuery
) =>
  useQuery({
    queryKey: QUERY_KEYS.tags.media.byMediaId(params.mediaId, query),
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
    queryKey: QUERY_KEYS.tags.media.bulk(mediaIds, dimensionId),
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
    queryKey: QUERY_KEYS.tags.media.forMedias(mediaIds),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.byMediaId(variables.mediaId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(variables.mediaId) });
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.byMediaId(assignment.mediaId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(assignment.mediaId) });
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.bulk([], undefined) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.list() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.byMediaId(variables.mediaId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(variables.mediaId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.bulk([], undefined) });
    },
  });
};

// Drift Prevention
export const useDriftPreventionStatsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.tags.driftPrevention.stats(),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.driftPrevention.stats() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.all() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.driftPrevention.stats() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.media.all() });
    },
  });
};
