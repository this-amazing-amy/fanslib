import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '../api/automation';

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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useIsAutomationRunning = () => useQuery({
    queryKey: ['automation', 'is-running'],
    queryFn: () => automationApi.isRunning(),
    refetchInterval: 2000,
  });



