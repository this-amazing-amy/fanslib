import type { InferResponseType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

type MediaEditsBySourceBody = InferResponseType<
  (typeof api.api)["media-edits"]["by-source"][":mediaId"]["$get"],
  200
>;

type MediaEditByIdResponse = InferResponseType<(typeof api.api)["media-edits"][":id"]["$get"], 200>;

type MediaEditByIdBody = Extract<MediaEditByIdResponse, { id: string }>;

type MediaEditQueueGet = (typeof api.api)["media-edits"]["queue"]["$get"];
type MediaEditQueueBody = InferResponseType<MediaEditQueueGet, 200>;

export type QueuedMediaEdit = MediaEditQueueBody[number] & {
  progress?: number;
};

export const useMediaEditsBySourceQuery = (mediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.mediaEdits.bySource(mediaId),
    queryFn: async (): Promise<MediaEditsBySourceBody> => {
      const result = await api.api["media-edits"]["by-source"][":mediaId"].$get({
        param: { mediaId },
      });
      return result.json();
    },
    enabled: !!mediaId,
  });

export const useMediaEditByIdQuery = (editId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.mediaEdits.byId(editId),
    queryFn: async (): Promise<MediaEditByIdBody> => {
      const result = await api.api["media-edits"][":id"].$get({
        param: { id: editId },
      });
      return result.json() as Promise<MediaEditByIdBody>;
    },
    enabled: !!editId,
  });

export const useDeleteMediaEditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const result = await api.api["media-edits"][":id"].$delete({
        param: { id },
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-edits"] });
    },
  });
};

export const useMediaEditQueueQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.mediaEdits.queue(),
    queryFn: async (): Promise<MediaEditQueueBody> => {
      const result = await api.api["media-edits"].queue.$get();
      return result.json();
    },
    refetchInterval: 10000,
  });
