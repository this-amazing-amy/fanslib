import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hashtagsApi } from '../api/hashtags';

export const useHashtagsQuery = () =>
  useQuery({
    queryKey: ['hashtags', 'list'],
    queryFn: () => hashtagsApi.getAll(),
  });

export const useHashtagQuery = (id: number) =>
  useQuery({
    queryKey: ['hashtags', id],
    queryFn: () => hashtagsApi.getById(id),
    enabled: !!id,
  });

export const useHashtagsByIdsQuery = (ids: number[]) =>
  useQuery({
    queryKey: ['hashtags', 'by-ids', ids],
    queryFn: () => hashtagsApi.getByIds(ids),
    enabled: ids.length > 0,
  });

export const useCreateHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => hashtagsApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useCreateHashtagsBatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (names: string[]) => hashtagsApi.createBatch(names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useDeleteHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hashtagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useHashtagStatsQuery = (id: number) =>
  useQuery({
    queryKey: ['hashtags', id, 'stats'],
    queryFn: () => hashtagsApi.getStats(id),
    enabled: !!id,
  });

export const useUpdateHashtagStatsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, channelId, views }: { id: number; channelId: string; views: number }) =>
      hashtagsApi.updateStats(id, channelId, views),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id] });
    },
  });
};



