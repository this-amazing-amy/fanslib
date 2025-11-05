import type { CreateSubredditRequest, UpdateSubredditRequest } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subredditsApi } from '../api/subreddits';

export const useSubredditsQuery = () =>
  useQuery({
    queryKey: ['subreddits', 'list'],
    queryFn: () => subredditsApi.getAll(),
  });

export const useSubredditQuery = (id: string) =>
  useQuery({
    queryKey: ['subreddits', id],
    queryFn: () => subredditsApi.getById(id),
    enabled: !!id,
  });

export const useCreateSubredditMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubredditRequest) => subredditsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};

export const useUpdateSubredditMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSubredditRequest }) =>
      subredditsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
      queryClient.setQueryData(['subreddits', variables.id], data);
    },
  });
};

export const useDeleteSubredditMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => subredditsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};

