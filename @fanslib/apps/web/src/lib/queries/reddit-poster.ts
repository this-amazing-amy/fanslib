import type { SubredditSchema } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

type Subreddit = typeof SubredditSchema.static;

export const useGenerateRandomPost = () => useMutation({
    mutationFn: async ({
      subreddits,
      channelId,
    }: {
      subreddits: Subreddit[];
      channelId: string;
    }) => {
      const response = await eden.api['reddit-automation']['generate-random-post'].post({
        subreddits,
        channelId,
      });
      return response.data;
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
      const response = await eden.api['reddit-automation']['generate-posts'].post({
        count,
        subreddits,
        channelId,
      });
      return response.data;
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
      const response = await eden.api['reddit-automation']['regenerate-media'].post({
        subredditId,
        channelId,
      });
      return response.data;
    },
  });

export const useSchedulePosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (posts: Array<unknown>) => {
      const response = await eden.api['reddit-automation']['schedule-posts'].post({
        posts,
      });
      return response.data;
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
      const response = await eden.api['reddit-automation']['scheduled-posts'].get();
      return response.data;
    },
  });



