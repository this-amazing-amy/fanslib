import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Subreddit } from '@fanslib/types';
import { redditPosterApi } from '../api/reddit-poster';

export const useGenerateRandomPost = () => useMutation({
    mutationFn: ({
      subreddits,
      channelId,
    }: {
      subreddits: Subreddit[];
      channelId: string;
    }) => redditPosterApi.generateRandomPost({ subreddits, channelId }),
  });

export const useGeneratePosts = () => useMutation({
    mutationFn: ({
      count,
      subreddits,
      channelId,
    }: {
      count: number;
      subreddits: Subreddit[];
      channelId: string;
    }) => redditPosterApi.generatePosts({ count, subreddits, channelId }),
  });

export const useRegenerateMedia = () => useMutation({
    mutationFn: ({
      subredditId,
      channelId,
    }: {
      subredditId: string;
      channelId: string;
    }) => redditPosterApi.regenerateMedia({ subredditId, channelId }),
  });

export const useSchedulePosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (posts: Array<unknown>) => redditPosterApi.schedulePosts({ posts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-poster', 'scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useScheduledPosts = () => useQuery({
    queryKey: ['reddit-poster', 'scheduled-posts'],
    queryFn: () => redditPosterApi.getScheduledPosts(),
  });

export const useLoginToReddit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId?: string) => redditPosterApi.login({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-poster', 'login-status'] });
    },
  });
};

export const useCheckRedditLogin = (userId?: string) => useQuery({
    queryKey: ['reddit-poster', 'login-status', userId],
    queryFn: () => redditPosterApi.checkLogin({ userId }),
  });



