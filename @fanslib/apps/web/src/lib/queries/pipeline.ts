import type { AssignMediaRequestBody, FetchCaptionQueueRequestQuery } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from './query-keys';

export const useAssignMediaMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AssignMediaRequestBody) => {
      const result = await api.api.pipeline.assign.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
    },
  });
};

export const useCaptionQueueQuery = (
  params: FetchCaptionQueueRequestQuery,
  refreshKey: number
) =>
  useQuery({
    queryKey: QUERY_KEYS.pipeline.captionQueue(params, refreshKey),
    queryFn: async () => {
      const result = await api.api.pipeline["caption-queue"].$get(params);
      const data = await result.json();
      return data ?? [];
    },
  });
