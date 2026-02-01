import type { DraftBlueskyPostRequestBody, FindRedgifsURLRequestBody, FindSubredditPostingTimesRequestBody, RefreshRedgifsURLRequestBody } from '@fanslib/server/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const useDraftBlueskyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DraftBlueskyPostRequestBody) => {
      const result = await api.api.postpone['draft-bluesky'].$post({ json: payload });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.postId) });
    },
  });
};

export const useFindRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FindRedgifsURLRequestBody) => {
      const result = await api.api.postpone['find-redgifs-url'].$post({ json: payload });
      return result.json();
    },
    onSuccess: (data, variables) => {
      if (data?.url) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(variables.mediaId) });
      }
    },
  });
};

export const useRefreshRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RefreshRedgifsURLRequestBody) => {
      const result = await api.api.postpone['refresh-redgifs-url'].$post({ json: payload });
      return result.json();
    },
    onSuccess: (data, variables) => {
      if (data?.url) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(variables.mediaId) });
      }
    },
  });
};

export const useFindSubredditPostingTimesMutation = () =>
  useMutation({
    mutationFn: async (payload: FindSubredditPostingTimesRequestBody) => {
      const result = await api.api.postpone['find-subreddit-posting-times'].$post({ json: payload });
      return result.json();
    },
  });



