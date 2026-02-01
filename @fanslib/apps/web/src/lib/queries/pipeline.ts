import type { AssignMediaRequestBody, FetchCaptionQueueRequestQuery } from '@fanslib/server/schemas';
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api/hono-client";

export const useAssignMediaMutation = () =>
  useMutation({
    mutationFn: async (data: AssignMediaRequestBody) => {
      const result = await api.api.pipeline.assign.$post({ json: data });
      return result.json();
    },
  });

export const useCaptionQueueQuery = (
  params: FetchCaptionQueueRequestQuery,
  refreshKey: number
) =>
  useQuery({
    queryKey: ["pipeline", "caption-queue", params, refreshKey],
    queryFn: async () => {
      const result = await api.api.pipeline["caption-queue"].$get(params);
      const data = await result.json();
      return data ?? [];
    },
  });
