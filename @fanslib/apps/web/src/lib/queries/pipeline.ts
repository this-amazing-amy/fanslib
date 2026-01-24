import type {
  AssignMediaRequestBodySchema,
  FetchCaptionQueueRequestQuerySchema,
} from "@fanslib/server/schemas";
import { useMutation, useQuery } from "@tanstack/react-query";
import { eden } from "../api/eden";

export const useAssignMediaMutation = () =>
  useMutation({
    mutationFn: async (data: typeof AssignMediaRequestBodySchema.static) => {
      const result = await eden.api.pipeline.assign.post(data);
      return result.data;
    },
  });

export const useCaptionQueueQuery = (
  params: typeof FetchCaptionQueueRequestQuerySchema.static,
  refreshKey: number
) =>
  useQuery({
    queryKey: ["pipeline", "caption-queue", params, refreshKey],
    queryFn: async () => {
      const result = await eden.api.pipeline["caption-queue"].get({
        query: params,
      });
      return result.data ?? [];
    },
  });
