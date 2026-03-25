import type {
  DeleteMediaRequestParams,
  FetchAllMediaRequestBody,
  FetchAllMediaResponse,
  FetchMediaByIdRequestParams,
  FetchMediaByIdResponse,
  FindAdjacentMediaBody,
  FindAdjacentMediaRequestParams,
  UpdateMediaRequestBody,
  UpdateMediaRequestParams,
} from "@fanslib/server/schemas";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import { QUERY_KEYS } from "./query-keys";

export const useMediaListQuery = (params?: FetchAllMediaRequestBody) =>
  useQuery({
    queryKey: QUERY_KEYS.media.list(params),
    queryFn: async () => {
      const result = await api.api.media.all.$post({ json: params ?? {} });
      return result.json();
    },
    placeholderData: keepPreviousData,
  });

const listCachePlaceholder = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  try {
    const listQueries = queryClient.getQueriesData<FetchAllMediaResponse>({
      queryKey: QUERY_KEYS.media.all,
    });
    const match = listQueries
      .map(([, data]) => data?.items?.find((m) => m.id === id))
      .find(Boolean);
    // postMedia is fetched separately on the detail page; this placeholder
    // only needs to provide enough data for the view transition to work
    if (match) return { ...match, postMedia: [] } as unknown as FetchMediaByIdResponse;
  } catch {
    // cache lookup is best-effort; any shape mismatch should not break the page
  }
  return undefined;
};

export const useMediaQuery = (params: FetchMediaByIdRequestParams) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: QUERY_KEYS.media.byId(params.id),
    queryFn: async () => {
      const result = await api.api.media["by-id"][":id"].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
    // oxlint-disable-next-line typescript/no-explicit-any
    placeholderData: listCachePlaceholder(queryClient, params.id) as any,
  });
};

export const useMediaPostingHistoryQuery = (mediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.media.postingHistory(mediaId),
    queryFn: async () => {
      const result = await api.api.media["by-id"][":id"]["posting-history"].$get({
        param: { id: mediaId },
      });
      return result.json();
    },
    enabled: !!mediaId,
  });

export const useBulkMediaPostingHistoryQuery = (mediaIds: string[]) =>
  useQuery({
    queryKey: ["media", "posting-history", "bulk", mediaIds],
    queryFn: async () => {
      const historyPromises = mediaIds.map((id) =>
        api.api.media["by-id"][":id"]["posting-history"]
          .$get({ param: { id } })
          .then((res) => res.json())
          .then((data) => ({ mediaId: id, history: data })),
      );
      const results = await Promise.all(historyPromises);
      return new Map(results.map((r) => [r.mediaId, r.history]));
    },
    enabled: mediaIds.length > 0,
    staleTime: 60000, // 1 minute
  });

export const useSiblingsQuery = (mediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.media.siblings(mediaId),
    queryFn: async () => {
      const result = await api.api.media[":id"].siblings.$get({
        param: { id: mediaId },
      });
      return result.json();
    },
    enabled: !!mediaId,
  });

export const useMediaAdjacentQuery = (
  params: FindAdjacentMediaRequestParams,
  body?: FindAdjacentMediaBody,
) =>
  useQuery({
    queryKey: QUERY_KEYS.media.adjacent(params.id, body),
    queryFn: async () => {
      const result = await api.api.media["by-id"][":id"].adjacent.$post({
        param: { id: params.id },
        json: body ?? {},
      });
      return result.json();
    },
    enabled: !!params.id,
  });

type UpdateMediaParams = UpdateMediaRequestParams & {
  updates: UpdateMediaRequestBody;
};

export const useUpdateMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateMediaParams) => {
      const result = await api.api.media["by-id"][":id"].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.setQueryData(QUERY_KEYS.media.byId(variables.id), data);
    },
  });
};

type DeleteMediaParams = DeleteMediaRequestParams & {
  deleteFile?: boolean;
};

export const useDeleteMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deleteFile = false }: DeleteMediaParams) => {
      const result = await api.api.media["by-id"][":id"].$delete({
        param: { id },
        query: { deleteFile: deleteFile ? "true" : undefined },
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
};
