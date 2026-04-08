import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

export const useCompositionsByShootQuery = (shootId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.shoots.compositions(shootId),
    queryFn: async () => {
      const result = await api.api.compositions["by-shoot"][":shootId"].$get({
        param: { shootId },
      });
      return result.json();
    },
    enabled: !!shootId,
  });

export const useCreateCompositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { shootId: string; name: string }) => {
      const result = await api.api.compositions.$post({ json: data });
      return result.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.shoots.compositions(variables.shootId),
      });
    },
  });
};

export const useUpdateCompositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      shootId: _shootId,
      updates,
    }: {
      id: string;
      shootId: string;
      updates: { name?: string };
    }) => {
      const result = await api.api.compositions["by-id"][":id"].$patch({
        param: { id },
        json: updates,
      });
      return result.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.shoots.compositions(variables.shootId),
      });
    },
  });
};

export const useDeleteCompositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, shootId: _shootId }: { id: string; shootId: string }) => {
      const result = await api.api.compositions["by-id"][":id"].$delete({
        param: { id },
      });
      return result.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.shoots.compositions(variables.shootId),
      });
    },
  });
};
