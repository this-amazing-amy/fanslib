import { useState, useEffect, useCallback, useRef } from "react";
import { X, RefreshCw, ExternalLink, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { useMediaEditQueueQuery, type QueuedMediaEdit } from "~/lib/queries/media-edits";
import { QUERY_KEYS } from "~/lib/queries/query-keys";

type RenderQueueDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RenderProgress = {
  editId: string;
  progress: number;
  status?: string;
};

export const RenderQueueDrawer = ({ open, onOpenChange }: RenderQueueDrawerProps) => {
  const { data: queueItems = [], isLoading } = useMediaEditQueueQuery();
  const queryClient = useQueryClient();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE connection for render progress
  useEffect(() => {
    if (!open) {
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
        setProgressMap((prev) => ({
          ...prev,
          [data.editId]: data.progress,
        }));

        // If completed or failed, refetch the queue
        if (data.status === "completed" || data.status === "failed") {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.mediaEdits.queue(),
          });
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
  }, [open, queryClient]);

  const handleRetry = useCallback(
    async (editId: string) => {
      try {
        const res = await fetch(`/api/media-edits/${editId}/queue`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to re-queue");
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.mediaEdits.queue(),
        });
      } catch (err) {
        console.error("Retry failed:", err);
      }
    },
    [queryClient],
  );

  const activeItems = queueItems.filter((i) => i.status === "rendering");
  const queuedItems = queueItems.filter((i) => i.status === "queued");
  const completedItems = queueItems.filter((i) => i.status === "completed");
  const failedItems = queueItems.filter((i) => i.status === "failed");

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => onOpenChange(false)} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h3 className="font-semibold text-base">Render Queue</h3>
          <Button size="sm" variant="ghost" onPress={() => onOpenChange(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px)] p-4 flex flex-col gap-4">
          {isLoading && <div className="text-center py-8 text-base-content/50">Loading...</div>}

          {!isLoading && queueItems.length === 0 && (
            <div className="text-center py-8 text-base-content/50 text-sm">
              No items in the render queue.
            </div>
          )}

          {/* Active / Rendering */}
          {activeItems.length > 0 && (
            <Section title="Rendering">
              {activeItems.map((item) => (
                <QueueItemCard key={item.id} item={item} progress={progressMap[item.id]} />
              ))}
            </Section>
          )}

          {/* Queued */}
          {queuedItems.length > 0 && (
            <Section title="Queued">
              {queuedItems.map((item) => (
                <QueueItemCard key={item.id} item={item} />
              ))}
            </Section>
          )}

          {/* Failed */}
          {failedItems.length > 0 && (
            <Section title="Failed">
              {failedItems.map((item) => (
                <FailedItemCard key={item.id} item={item} onRetry={handleRetry} />
              ))}
            </Section>
          )}

          {/* Completed */}
          {completedItems.length > 0 && (
            <Section title="Completed">
              {completedItems.map((item) => (
                <CompletedItemCard key={item.id} item={item} />
              ))}
            </Section>
          )}
        </div>
      </div>
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
      {title}
    </h4>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

const QueueItemCard = ({ item, progress }: { item: QueuedMediaEdit; progress?: number }) => {
  const isRendering = item.status === "rendering";
  const pct = progress ?? item.progress ?? 0;

  return (
    <div className="bg-base-200 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        {isRendering ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
        ) : (
          <div className="h-3.5 w-3.5 rounded-full bg-base-300" />
        )}
        <span className="truncate font-medium">{item.id.slice(0, 8)}...</span>
      </div>
      {isRendering && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-base-content/60 mb-1">
            <span>Progress</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-1.5">
            <div
              className="bg-info h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const FailedItemCard = ({
  item,
  onRetry,
}: {
  item: QueuedMediaEdit;
  onRetry: (id: string) => void;
}) => (
  <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm">
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle className="h-3.5 w-3.5 text-error" />
      <span className="truncate font-medium">{item.id.slice(0, 8)}...</span>
    </div>
    {item.error && <p className="text-xs text-error/80 mt-1 line-clamp-2">{item.error}</p>}
    <div className="mt-2">
      <Button size="sm" variant="ghost" onPress={() => onRetry(item.id)}>
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </div>
  </div>
);

const CompletedItemCard = ({ item }: { item: QueuedMediaEdit }) => (
  <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-sm">
    <div className="flex items-center gap-2">
      <CheckCircle className="h-3.5 w-3.5 text-success" />
      <span className="truncate font-medium">{item.id.slice(0, 8)}...</span>
      {item.outputMediaId && (
        <a
          href={`/content/library/media/${item.outputMediaId}`}
          className="ml-auto text-success hover:text-success/80"
          title="View output media"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  </div>
);
