import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/lib/queries/query-keys";

type RenderProgress = {
  editId: string;
  progress: number;
  status?: string;
};

/**
 * Shared hook for SSE render progress. Connects to the render-progress
 * endpoint and returns a map of editId -> progress percentage.
 *
 * @param enabled - Whether the SSE connection should be active (default true)
 */
export const useRenderProgress = (enabled = true) => {
  const queryClient = useQueryClient();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource("/api/media-edits/render-progress");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: RenderProgress = JSON.parse(event.data);
        setProgressMap((prev) => ({ ...prev, [data.editId]: data.progress }));

        if (data.status === "completed" || data.status === "failed") {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mediaEdits.queue() });
        }
      } catch {
        // Ignore parse errors from SSE
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [enabled, queryClient]);

  return progressMap;
};
