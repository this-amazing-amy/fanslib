import type { Post, PostCreateData, PostFilters } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/posts';

export const usePostsQuery = (filters?: PostFilters) =>
  useQuery({
    queryKey: ['posts', 'list', filters],
    queryFn: () => postsApi.getAll(filters),
  });

export const usePostQuery = (id: string) =>
  useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsApi.getById(id),
    enabled: !!id,
  });

export const usePostsByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: ['posts', 'by-channel', channelId],
    queryFn: () => postsApi.byChannel(channelId),
    enabled: !!channelId,
  });

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, mediaIds }: { data: PostCreateData; mediaIds: string[] }) =>
      postsApi.create(data, mediaIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'by-channel'] });
    },
  });
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Post> }) =>
      postsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.setQueryData(['posts', variables.id], data);
    },
  });
};

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

export const useAddMediaToPostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, mediaIds }: { postId: string; mediaIds: string[] }) =>
      postsApi.addMedia(postId, mediaIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

export const useRemoveMediaFromPostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, mediaIds }: { postId: string; mediaIds: string[] }) =>
      postsApi.removeMedia(postId, mediaIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

