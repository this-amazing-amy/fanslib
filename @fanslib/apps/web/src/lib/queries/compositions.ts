import type { InferResponseType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

type CompositionByIdResponse = InferResponseType<
  (typeof api.api.compositions)["by-id"][":id"]["$get"],
  200
>;

export type Composition = CompositionByIdResponse;

export const useCompositionByIdQuery = (compositionId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.compositions.byId(compositionId),
    queryFn: async (): Promise<CompositionByIdResponse> => {
      const result = await api.api.compositions["by-id"][":id"].$get({
        param: { id: compositionId },
      });
      return result.json() as Promise<CompositionByIdResponse>;
    },
    enabled: !!compositionId,
  });

type UpdateCompositionParams = {
  id: string;
  segments?: unknown[];
  tracks?: unknown[];
  exportRegions?: unknown[];
  name?: string;
};

export const useUpdateCompositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCompositionParams) => {
      const result = await api.api.compositions["by-id"][":id"].$patch({
        param: { id },
        json: updates,
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compositions.byId(variables.id) });
    },
  });
};
