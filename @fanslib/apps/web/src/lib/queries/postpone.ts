import type {
  DraftBlueskyPostRequestBodySchema,
  FindRedgifsURLRequestBodySchema,
  FindSubredditPostingTimesRequestBodySchema,
  RefreshRedgifsURLRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useDraftBlueskyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: typeof DraftBlueskyPostRequestBodySchema.static) => {
      const result = await eden.api.postpone['draft-bluesky'].post(payload);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
    },
  });
};

export const useFindRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: typeof FindRedgifsURLRequestBodySchema.static) => {
      const result = await eden.api.postpone['find-redgifs-url'].post(payload);
      return result.data;
    },
    onSuccess: (data, variables) => {
      if (data?.url) {
        queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
      }
    },
  });
};

export const useRefreshRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: typeof RefreshRedgifsURLRequestBodySchema.static) => {
      const result = await eden.api.postpone['refresh-redgifs-url'].post(payload);
      return result.data;
    },
    onSuccess: (data, variables) => {
      if (data?.url) {
        queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
      }
    },
  });
};

export const useFindSubredditPostingTimesMutation = () =>
  useMutation({
    mutationFn: async (payload: typeof FindSubredditPostingTimesRequestBodySchema.static) => {
      const result = await eden.api.postpone['find-subreddit-posting-times'].post(payload);
      return result.data;
    },
  });



