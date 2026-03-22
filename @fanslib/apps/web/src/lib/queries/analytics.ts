import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

export const usePostMediaAnalyticsQuery = (postMediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.datapoints(postMediaId),
    queryFn: async () => {
      const result = await api.api.analytics.datapoints[":postMediaId"].$get({
        param: { postMediaId },
      });
      return result.json();
    },
    enabled: !!postMediaId,
  });

export const useActiveFypPostsQuery = (sortBy?: "views" | "engagementPercent" | "engagementSeconds") =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.activeFypPosts(sortBy),
    queryFn: async () => {
      const result = await api.api.analytics['active-fyp-posts'].$get({
        query: { sortBy },
      });
      return result.json();
    },
  });

export const useRepostCandidatesQuery = (sortBy?: "views" | "engagementPercent" | "engagementSeconds") =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.repostCandidates(sortBy),
    queryFn: async () => {
      const result = await api.api.analytics['repost-candidates'].$get({
        query: { sortBy },
      });
      return result.json();
    },
  });

export const useFetchFanslyDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postMediaId,
      startDate,
      endDate,
    }: {
      postMediaId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const result = await api.api.analytics.fetch["by-id"][":postMediaId"].$post({
        param: { postMediaId },
        json: { startDate, endDate },
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.datapoints(variables.postMediaId),
      });
    },
  });
};
