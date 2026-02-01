import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '../api/automation';
import { QUERY_KEYS } from './query-keys';

export const usePostToReddit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subredditId,
      mediaId,
      caption,
    }: {
      subredditId: string;
      mediaId: string;
      caption: string;
    }) => automationApi.postToReddit({ subredditId, mediaId, caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};

export const useIsAutomationRunning = () => useQuery({
    queryKey: QUERY_KEYS.automation.isRunning(),
    queryFn: () => automationApi.isRunning(),
    refetchInterval: 2000,
  });



