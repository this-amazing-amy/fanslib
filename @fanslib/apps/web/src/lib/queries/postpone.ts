import type {
  FindRedgifsURLPayload,
  FindSubredditPostingTimesPayload,
  PostponeBlueskyDraftPayload,
  RefreshRedgifsURLPayload,
} from '@fanslib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postponeApi } from '../api/postpone';

export const useDraftBlueskyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostponeBlueskyDraftPayload) => postponeApi.draftBluesky(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
    },
  });
};

export const useFindRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FindRedgifsURLPayload) => postponeApi.findRedgifsUrl(payload),
    onSuccess: (data, variables) => {
      if (data.url) {
        queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
      }
    },
  });
};

export const useRefreshRedgifsUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RefreshRedgifsURLPayload) => postponeApi.refreshRedgifsUrl(payload),
    onSuccess: (data, variables) => {
      if (data.url) {
        queryClient.invalidateQueries({ queryKey: ['media', variables.mediaId] });
      }
    },
  });
};

export const useFindSubredditPostingTimesMutation = () =>
  useMutation({
    mutationFn: (payload: FindSubredditPostingTimesPayload) =>
      postponeApi.findSubredditPostingTimes(payload),
  });



