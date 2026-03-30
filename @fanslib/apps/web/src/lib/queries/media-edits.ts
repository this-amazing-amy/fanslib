import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./query-keys";

type MediaEdit = {
  id: string;
  sourceMediaId: string;
  outputMediaId: string | null;
  type: "transform" | "clip";
  operations: unknown[];
  status: "draft" | "queued" | "rendering" | "completed" | "failed";
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const useMediaEditsBySourceQuery = (mediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.mediaEdits.bySource(mediaId),
    queryFn: async (): Promise<MediaEdit[]> => {
      const res = await fetch(`/api/media-edits/by-source/${mediaId}`);
      if (!res.ok) throw new Error("Failed to fetch media edits");
      return res.json();
    },
    enabled: !!mediaId,
  });

export const useMediaEditByIdQuery = (editId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.mediaEdits.byId(editId),
    queryFn: async (): Promise<MediaEdit> => {
      const res = await fetch(`/api/media-edits/${editId}`);
      if (!res.ok) throw new Error("Failed to fetch media edit");
      return res.json();
    },
    enabled: !!editId,
  });
