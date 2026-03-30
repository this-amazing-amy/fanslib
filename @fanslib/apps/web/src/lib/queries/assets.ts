import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./query-keys";

type Asset = {
  id: string;
  name: string;
  type: "image" | "audio";
  filename: string;
  createdAt: Date;
};

export const useAssetsQuery = (type?: "image" | "audio") =>
  useQuery({
    queryKey: QUERY_KEYS.assets.all(type),
    queryFn: async (): Promise<Asset[]> => {
      const url = type ? `/api/assets?type=${type}` : "/api/assets";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
  });

export const useUploadAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      const res = await fetch("/api/assets/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all() });
    },
  });
};

export const useRenameAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Rename failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all() });
    },
  });
};

export const useDeleteAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all() });
    },
  });
};
