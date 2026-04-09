import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  RefreshCw,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { ContentRatingBadge, RoleBadge, PackageBadge } from "~/components/media-fields";
import { Button } from "~/components/ui/Button";
import { api } from "~/lib/api/hono-client";
import { useMediaEditQueueQuery, type QueuedMediaEdit } from "~/lib/queries/media-edits";
import { QUERY_KEYS } from "~/lib/queries/query-keys";
import { useRenderProgress } from "~/hooks/useRenderProgress";


const editLabel = (item: QueuedMediaEdit): string => {
  const source = (item as Record<string, unknown>).sourceMedia as
    | { name?: string }
    | undefined;
  return source?.name ?? item.id.slice(0, 8);
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "rendering":
      return <Loader2 className="h-6 w-6 animate-spin text-info shrink-0" />;
    case "completed":
      return <CheckCircle className="h-6 w-6 text-success shrink-0" />;
    case "failed":
      return <AlertTriangle className="h-6 w-6 text-error shrink-0" />;
    default:
      return <Clock className="h-6 w-6 text-base-content/40 shrink-0" />;
  }
};

const Badges = ({ item }: { item: QueuedMediaEdit }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {item.package && <PackageBadge pkg={item.package} />}
    {item.role && <RoleBadge role={item.role} />}
    {item.contentRating && <ContentRatingBadge rating={item.contentRating} />}
  </div>
);

const Thumbnail = ({ mediaId }: { mediaId: string }) => (
  <img
    src={`/api/media/${mediaId}/thumbnail`}
    alt=""
    className="w-14 h-14 rounded-md object-cover bg-base-300 shrink-0"
  />
);

const RenderQueuePage = () => {
  const { data: queueItems = [], isLoading } = useMediaEditQueueQuery();
  const queryClient = useQueryClient();
  const progressMap = useRenderProgress();

  const handleRetry = useCallback(
    async (editId: string) => {
      try {
        await api.api["media-edits"][":id"].queue.$post({ param: { id: editId } });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mediaEdits.queue() });
      } catch (err) {
        console.error("Retry failed:", err);
      }
    },
    [queryClient],
  );

  const handleClearCompleted = useCallback(async () => {
    try {
      await api.api["media-edits"].queue.completed.$delete();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mediaEdits.queue() });
    } catch (err) {
      console.error("Clear failed:", err);
    }
  }, [queryClient]);

  const hasCompleted = queueItems.some((i) => i.status === "completed");

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Render Queue</h1>
        {hasCompleted && (
          <Button size="sm" variant="ghost" onPress={handleClearCompleted}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear completed
          </Button>
        )}
      </div>

      {isLoading && <div className="text-center py-8 text-base-content/50">Loading...</div>}

      {!isLoading && queueItems.length === 0 && (
        <div className="text-center py-16 text-base-content/50">No items in the render queue.</div>
      )}

      <div className="flex flex-col gap-2">
        {queueItems.map((item) => {
          const pct = progressMap[item.id] ?? (item as { progress?: number }).progress ?? 0;
          const thumbId =
            item.status === "completed" && item.outputMediaId
              ? item.outputMediaId
              : item.sourceMediaId;

          const linkTo =
            item.status === "completed" && item.outputMediaId
              ? `/library/${item.outputMediaId}`
              : undefined;
          const Wrapper = linkTo
            ? ({ children }: { children: React.ReactNode }) => (
                <a key={item.id} href={linkTo} className="border border-base-content rounded-lg p-4 text-sm flex gap-3 hover:bg-base-200 transition-colors">
                  {children}
                </a>
              )
            : ({ children }: { children: React.ReactNode }) => (
                <div key={item.id} className="border border-base-content rounded-lg p-4 text-sm flex gap-3">
                  {children}
                </div>
              );

          return (
            <Wrapper key={item.id}>
              <Thumbnail mediaId={thumbId} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium break-all">{editLabel(item)}</span>
                  <div className="ml-auto shrink-0"><StatusIcon status={item.status} /></div>
                </div>
                <div className="mt-1">
                  <Badges item={item} />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {item.createdAt && (
                    <span className="text-xs text-base-content/40">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  )}
                  {item.status === "failed" && item.error && (
                    <span className="text-xs text-error">{item.error}</span>
                  )}
                </div>

                {item.status === "rendering" && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-base-content/60 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className="bg-info h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {item.status === "failed" && (
                  <div className="mt-2">
                    <Button size="sm" variant="ghost" onPress={() => handleRetry(item.id)}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/render-queue")({
  component: RenderQueuePage,
});
