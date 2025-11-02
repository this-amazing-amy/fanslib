import type {
  AssignTagsDto,
  CreateTagDefinitionDto,
  CreateTagDimensionDto,
  UpdateTagDefinitionDto,
  UpdateTagDimensionDto,
} from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags';

export const useTagDimensionsQuery = () =>
  useQuery({
    queryKey: ['tags', 'dimensions'],
    queryFn: () => tagsApi.getDimensions(),
  });

export const useTagDimensionQuery = (id: number) =>
  useQuery({
    queryKey: ['tags', 'dimensions', id],
    queryFn: () => tagsApi.getDimensionById(id),
    enabled: !!id,
  });

export const useCreateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagDimensionDto) => tagsApi.createDimension(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
    },
  });
};

export const useUpdateTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateTagDimensionDto }) =>
      tagsApi.updateDimension(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.setQueryData(['tags', 'dimensions', variables.id], data);
    },
  });
};

export const useDeleteTagDimensionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagsApi.deleteDimension(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'dimensions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
    },
  });
};

export const useTagDefinitionsByDimensionQuery = (dimensionId: number) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-dimension', dimensionId],
    queryFn: () => tagsApi.getDefinitionsByDimension(dimensionId),
    enabled: !!dimensionId,
  });

export const useTagDefinitionQuery = (id: number) =>
  useQuery({
    queryKey: ['tags', 'definitions', id],
    queryFn: () => tagsApi.getDefinitionById(id),
    enabled: !!id,
  });

export const useTagDefinitionsByIdsQuery = (ids: number[]) =>
  useQuery({
    queryKey: ['tags', 'definitions', 'by-ids', ids],
    queryFn: () => tagsApi.getDefinitionsByIds(ids),
    enabled: ids.length > 0,
  });

export const useCreateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagDefinitionDto) => tagsApi.createDefinition(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
      queryClient.invalidateQueries({
        queryKey: ['tags', 'definitions', 'by-dimension', data.dimensionId],
      });
    },
  });
};

export const useUpdateTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateTagDefinitionDto }) =>
      tagsApi.updateDefinition(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
      queryClient.setQueryData(['tags', 'definitions', variables.id], data);
      queryClient.invalidateQueries({
        queryKey: ['tags', 'definitions', 'by-dimension', data.dimensionId],
      });
    },
  });
};

export const useDeleteTagDefinitionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagsApi.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'definitions'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};

export const useMediaTagsQuery = (mediaId: string, dimensionId?: number) =>
  useQuery({
    queryKey: ['tags', 'media', mediaId, dimensionId],
    queryFn: () => tagsApi.getMediaTags(mediaId, dimensionId),
    enabled: !!mediaId,
  });

export const useAssignTagsToMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignTagsDto) => tagsApi.assignTagsToMedia(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', variables.mediaId] });
      queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
    },
  });
};

export const useBulkAssignTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignments: AssignTagsDto[]) => tagsApi.bulkAssignTags(assignments),
    onSuccess: (_, variables) => {
      variables.forEach((assignment) => {
        queryClient.invalidateQueries({ queryKey: ['tags', 'media', assignment.mediaId] });
        queryClient.invalidateQueries({ queryKey: ['media', assignment.mediaId] });
      });
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};

export const useRemoveTagsFromMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mediaId, tagIds }: { mediaId: string; tagIds: number[] }) =>
      tagsApi.removeTagsFromMedia(mediaId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'media', variables.mediaId] });
      queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
    },
  });
};

export const useDriftPreventionStatsQuery = () =>
  useQuery({
    queryKey: ['tags', 'drift-prevention', 'stats'],
    queryFn: () => tagsApi.getDriftPreventionStats(),
  });

export const usePerformCleanupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tagsApi.performCleanup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'drift-prevention', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};

export const useSyncStickerDisplayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tagsApi.syncStickerDisplay(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'drift-prevention', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'media'] });
    },
  });
};



