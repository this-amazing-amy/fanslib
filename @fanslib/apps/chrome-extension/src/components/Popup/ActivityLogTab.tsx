import { useEffect, useState } from 'react';
import {
  clearActivityLog,
  getActivityLog,
  type ActivityLogEntry,
} from '../../lib/activity-log';

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60)
    return `${diffMinutes}m ago`;
  if (diffHours < 24)
    return `${diffHours}h ago`;
  if (diffDays < 7)
    return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const typeStyles: Record<ActivityLogEntry['type'], { dot: string; text: string }> = {
  success: { dot: 'bg-green-500', text: 'text-green-600' },
  warning: { dot: 'bg-yellow-500', text: 'text-yellow-600' },
  error: { dot: 'bg-red-500', text: 'text-red-600' },
};

export const ActivityLogTab = () => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const log = await getActivityLog();
      setEntries(log);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();

    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local' && changes.fanslib_activity_log) {
        const newEntries = changes.fanslib_activity_log.newValue;
        if (Array.isArray(newEntries)) {
          setEntries(newEntries as ActivityLogEntry[]);
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
      return () => {
        chrome.storage.onChanged.removeListener(storageListener);
      };
    }
  }, []);

  const handleClear = async () => {
    await clearActivityLog();
    setEntries([]);
  };

  return (
    <div className='px-3 pt-3 pb-4'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-semibold'>Activity Log</h3>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className='btn btn-ghost btn-xs'
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className='text-sm text-base-content/70'>Loading...</div>
      ) : entries.length === 0 ? (
        <div className='text-sm text-base-content/50 text-center py-8'>
          No activity yet
        </div>
      ) : (
        <div className='space-y-1 max-h-[calc(100vh-10rem)] overflow-y-auto'>
          {entries.map((entry, index) => {
            const styles = typeStyles[entry.type];
            return (
              <div
                key={`${entry.timestamp}-${index}`}
                className='flex items-start gap-2 p-2 rounded-lg hover:bg-base-200'
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${styles.dot}`}
                />
                <div className='flex-1 min-w-0'>
                  <div className='text-xs leading-relaxed'>
                    {entry.message}
                  </div>
                  <div className='text-[10px] text-base-content/40 mt-0.5'>
                    {formatRelativeTime(entry.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
