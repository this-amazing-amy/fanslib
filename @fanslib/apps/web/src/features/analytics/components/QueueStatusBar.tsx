import { X } from "lucide-react";
import { useState } from "react";
import { useQueueStateQuery } from "~/lib/queries/analytics";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

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
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !data) return null;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg bg-base-200 px-3 py-2 text-sm cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>
          {data.totalPending} pending
          {data.nextFetchAt && ` · next in ${formatRelativeTime(data.nextFetchAt)}`}
        </span>
      </div>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-base-300 bg-base-100 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Fetch Queue</h3>
            <button
              aria-label="Close drawer"
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li
                key={item.postMediaId}
                className={`flex items-center gap-3 rounded-lg p-2 ${item.overdue ? "bg-warning/10" : ""}`}
              >
                <img
                  src={getMediaThumbnailUrl(extractMediaId(item.thumbnailUrl))}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{item.caption}</p>
                  <p className="text-xs text-base-content/60">
                    {formatRelativeTime(item.nextFetchAt)} · {new Date(item.nextFetchAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
