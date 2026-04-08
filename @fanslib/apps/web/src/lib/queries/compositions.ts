import type { InferResponseType } from "hono";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export const useCreateCompositionMutation = () =>
  useMutation({
    mutationFn: async (payload: { shootId: string; name: string }) => {
      const result = await api.api.compositions.$post({ json: payload });
      return result.json();
    },
  });

export const useUpdateCompositionMutation = () =>
  useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; segments?: unknown[]; tracks?: unknown[]; exportRegions?: unknown[] };
    }) => {
      const result = await api.api.compositions["by-id"][":id"].$patch({
        param: { id },
        json: body,
      });
      return result.json();
    },
  });
