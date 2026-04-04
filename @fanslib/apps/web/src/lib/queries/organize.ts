import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

export const useUnmanagedMediaQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.organize.unmanaged(),
    queryFn: async () => {
      const result = await api.api.library.unmanaged.$get();
      return result.json();
    },
  });

export const useKnownRolesQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.organize.knownRoles(),
    queryFn: async () => {
      const result = await api.api.library["known-roles"].$get();
      return result.json();
    },
  });

export const useKnownPackagesQuery = (shootId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.organize.knownPackages(shootId),
    queryFn: async () => {
      const result = await api.api.library["known-packages"].$get({
        query: { shootId },
      });
      return result.json();
    },
    enabled: !!shootId,
  });

export const useOrganizeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      entries: Array<{
        mediaId: string;
        shootId: string;
        package: string;
        role: string;
        contentRating: "xt" | "uc" | "cn" | "sg" | "sf";
      }>,
    ) => {
      const result = await api.api.library.organize.$post({
        json: { entries },
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organize.unmanaged() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
    },
  });
};
