import type { Subreddit } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';


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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.redditAutomation.scheduledPosts() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subreddits.all() });
    },
  });
};

export const useScheduledPosts = () => useQuery({
    queryKey: QUERY_KEYS.redditAutomation.scheduledPosts(),
    queryFn: async () => {
      const result = await api.api['reddit-automation']['scheduled-posts'].$get();
      return result.json();
    },
  });



