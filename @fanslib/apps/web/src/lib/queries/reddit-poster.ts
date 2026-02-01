import type { Subreddit, SubredditSchema } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';


export const useGenerateRandomPost = () => useMutation({
    mutationFn: async ({
      subreddits,
      channelId,
    }: {
      subreddits: Subreddit[];
      channelId: string;
    }) => {
      const result = await api.api['reddit-automation']['generate-random-post'].$post({
        json: { subreddits, channelId }
      });
      return result.json();
    },
  });

export const useGeneratePosts = () => useMutation({
    mutationFn: async ({
      count,
      subreddits,
      channelId,
    }: {
      count: number;
      subreddits: Subreddit[];
      channelId: string;
    }) => {
      const result = await api.api['reddit-automation']['generate-posts'].$post({
        json: { count, subreddits, channelId }
      });
      return result.json();
    },
  });

export const useRegenerateMedia = () => useMutation({
    mutationFn: async ({
      subredditId,
      channelId,
    }: {
      subredditId: string;
      channelId: string;
    }) => {
      const result = await api.api['reddit-automation']['regenerate-media'].$post({
        json: { subredditId, channelId }
      });
      return result.json();
    },
  });

export const useSchedulePosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (posts: Array<unknown>) => {
      const result = await api.api['reddit-automation']['schedule-posts'].$post({
        json: { posts }
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-automation', 'scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['subreddits'] });
    },
  });
};

export const useScheduledPosts = () => useQuery({
    queryKey: ['reddit-automation', 'scheduled-posts'],
    queryFn: async () => {
      const result = await api.api['reddit-automation']['scheduled-posts'].$get();
      return result.json();
    },
  });



