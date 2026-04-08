import type { InferResponseType } from "hono";
import { useQuery } from "@tanstack/react-query";
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
