import { X } from "lucide-react";
import { useOverlayTriggerState } from "react-stately";
import { useQueueStateQuery, useFetchFanslyDataMutation } from "~/lib/queries/analytics";
import { getMediaThumbnailUrl } from "~/lib/media-urls";
import { cn } from "~/lib/cn";
import { Sheet, SheetTitle } from "~/components/ui/Sheet/Sheet";
import { Button } from "~/components/ui/Button";

const formatRelativeTime = (isoDate: string): string => {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const extractMediaId = (thumbnailUrl: string): string =>
  thumbnailUrl.replace("thumbnail://", "");

export const QueueStatusBar = () => {
  const { data, isLoading } = useQueueStateQuery();
  const fetchMutation = useFetchFanslyDataMutation();
  const sheetState = useOverlayTriggerState({});

  if (isLoading || !data) return null;

  const summaryLine = (
    <>
      {data.totalPending} pending
      {data.nextFetchAt && ` · next in ${formatRelativeTime(data.nextFetchAt)}`}
    </>
  );

  return (
    <>
      {!sheetState.isOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="pointer-events-auto w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className={cn(
                "w-full border-t border-base-200 bg-white px-4 py-3 text-center text-sm",
                "hover:bg-base-200/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              )}
              onClick={() => sheetState.open()}
              aria-expanded={false}
              aria-haspopup="dialog"
            >
              <span className="font-medium text-base-content tabular-nums">{summaryLine}</span>
            </button>
          </div>
        </div>
      ) : null}

      <Sheet
        state={sheetState}
        side="bottom"
        showCloseButton={false}
        className="flex max-h-[85dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 shadow-none"
        aria-label="Fetch queue"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-200 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <SheetTitle className="text-base">Fetch Queue</SheetTitle>
            <p className="mt-0.5 text-xs text-base-content/60 tabular-nums">{summaryLine}</p>
          </div>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Close fetch queue"
            className="btn-square btn-circle shrink-0"
            onPress={() => sheetState.close()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ul className="min-h-0 flex-1 list-none space-y-2 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-gutter:stable]">
          {data.items.map((item) => (
            <li
              key={item.postMediaId}
              className={cn(
                "flex items-center gap-3 rounded-lg p-2",
                item.overdue ? "bg-warning/10" : "",
              )}
            >
              <img
                src={getMediaThumbnailUrl(extractMediaId(item.thumbnailUrl))}
                alt=""
                className="h-10 w-10 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.caption}</p>
                <p className="text-xs text-base-content/60">
                  {formatRelativeTime(item.nextFetchAt)} · {new Date(item.nextFetchAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {fetchMutation.isError && fetchMutation.variables?.postMediaId === item.postMediaId && (
                  <span className="text-xs text-error">Fetch failed</span>
                )}
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  disabled={fetchMutation.isPending && fetchMutation.variables?.postMediaId === item.postMediaId}
                  onClick={() => fetchMutation.mutate({ postMediaId: item.postMediaId })}
                >
                  {fetchMutation.isPending && fetchMutation.variables?.postMediaId === item.postMediaId
                    ? "Fetching..."
                    : "Fetch Now"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
};
