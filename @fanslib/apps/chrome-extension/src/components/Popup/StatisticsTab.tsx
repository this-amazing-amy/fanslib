import { useEffect, useState } from 'react';
import { eden } from '../../lib/api';
import { getSettings } from '../../lib/storage';
import { debug } from '../../lib/utils';

type SyncStatus = {
  lastSyncAt: number | null;
  lastSyncCount: number | null;
  pendingCount: number;
  lastError: string | null;
  lastErrorAt: number | null;
};

export const StatisticsTab = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    lastSyncCount: null,
    pendingCount: 0,
    lastError: null,
    lastErrorAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [webUrl, setWebUrl] = useState<string | null>(null);

  useEffect(() => {
    debug('info', 'StatisticsTab mounted, loading status', {
      component: 'StatisticsTab',
      action: 'mount',
    });
    loadStatus();
  }, []);

  const loadStatus = async () => {
    debug('debug', 'Starting to load statistics status', {
      component: 'StatisticsTab',
      action: 'loadStatus',
    });

    try {
      const settings = await getSettings();
      debug(
        'debug',
        'Settings loaded',
        {
          component: 'StatisticsTab',
          action: 'loadStatus',
        },
        {
          apiUrl: settings.apiUrl,
          webUrl: settings.webUrl,
          hasLibraryPath: !!settings.libraryPath,
        }
      );

      setWebUrl(settings.webUrl);

      debug('debug', 'Fetching sync data from chrome.storage', {
        component: 'StatisticsTab',
        action: 'loadStatus',
      });

      const storage = await chrome.storage.local.get([
        'lastSyncAt',
        'lastSyncCount',
        'lastSyncError',
        'lastSyncErrorAt',
      ]);

      debug(
        'debug',
        'Sync data retrieved from storage',
        {
          component: 'StatisticsTab',
          action: 'loadStatus',
        },
        {
          lastSyncAt: storage.lastSyncAt,
          lastSyncCount: storage.lastSyncCount,
          hasLastSyncAt: storage.lastSyncAt !== undefined,
          hasLastSyncCount: storage.lastSyncCount !== undefined,
          lastSyncError: storage.lastSyncError,
          hasError: !!storage.lastSyncError,
        }
      );

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: storage.lastSyncAt ?? null,
        lastSyncCount: storage.lastSyncCount ?? null,
        lastError: storage.lastSyncError ?? null,
        lastErrorAt: storage.lastSyncErrorAt ?? null,
      }));

      debug(
        'debug',
        'Fetching pending candidates from API',
        {
          component: 'StatisticsTab',
          action: 'loadStatus',
        },
        {
          apiUrl: settings.apiUrl,
          endpoint: '/api/analytics/candidates',
          query: { status: 'pending', limit: 1 },
        }
      );

      const api = eden(settings.apiUrl);
      const response = await api.api.analytics.candidates.get({
        query: { status: 'pending', limit: 1 },
      });

      debug(
        'debug',
        'API response received',
        {
          component: 'StatisticsTab',
          action: 'loadStatus',
        },
        {
          hasError: !!response.error,
          hasData: !!response.data,
          responseKeys: response ? Object.keys(response) : [],
        }
      );

      if (response.error) {
        debug(
          'error',
          'API returned error response',
          {
            component: 'StatisticsTab',
            action: 'loadStatus',
          },
          response.error
        );
      }

      if (!response.error && response.data) {
        const pendingCount = response.data.total ?? 0;

        debug(
          'info',
          'Pending candidates count retrieved',
          {
            component: 'StatisticsTab',
            action: 'loadStatus',
          },
          {
            pendingCount,
            dataKeys: Object.keys(response.data),
          }
        );

        setSyncStatus((prev) => ({
          ...prev,
          pendingCount,
        }));
      }

      debug('info', 'Statistics status loaded successfully', {
        component: 'StatisticsTab',
        action: 'loadStatus',
      });
    } catch (error) {
      debug(
        'error',
        'Failed to load sync status',
        {
          component: 'StatisticsTab',
          action: 'loadStatus',
        },
        {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        }
      );
    } finally {
      setLoading(false);
      debug('debug', 'Loading state set to false', {
        component: 'StatisticsTab',
        action: 'loadStatus',
      });
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    debug(
      'debug',
      'Formatting last sync timestamp',
      {
        component: 'StatisticsTab',
        action: 'formatLastSync',
      },
      { timestamp, isNull: timestamp === null }
    );

    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const clearError = async () => {
    debug('info', 'Clearing sync error', {
      component: 'StatisticsTab',
      action: 'clearError',
    });

    try {
      await chrome.storage.local.set({
        lastSyncError: null,
        lastSyncErrorAt: null,
      });

      setSyncStatus((prev) => ({
        ...prev,
        lastError: null,
        lastErrorAt: null,
      }));

      debug('info', 'Sync error cleared successfully', {
        component: 'StatisticsTab',
        action: 'clearError',
      });
    } catch (error) {
      debug(
        'error',
        'Failed to clear sync error',
        {
          component: 'StatisticsTab',
          action: 'clearError',
        },
        {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      );
    }
  };

  const openMatchingPage = () => {
    debug(
      'info',
      'Opening matching page',
      {
        component: 'StatisticsTab',
        action: 'openMatchingPage',
      },
      {
        webUrl,
        fullUrl: webUrl ? `${webUrl}/analytics/matching` : null,
      }
    );

    if (webUrl) {
      chrome.tabs.create({ url: `${webUrl}/analytics/matching` });
    } else {
      debug('warn', 'Cannot open matching page: webUrl is null', {
        component: 'StatisticsTab',
        action: 'openMatchingPage',
      });
    }
  };

  return (
    <div className='px-3 pt-3 pb-4'>
      <div className='space-y-4'>
        {syncStatus.lastError && (
          <div className='alert alert-error text-sm py-2 px-3 relative'>
            <button
              onClick={clearError}
              className='absolute top-2 right-2 btn btn-ghost btn-xs btn-circle'
              aria-label='Dismiss error'
            >
              ✕
            </button>
            <div className='flex flex-col gap-1 pr-6'>
              <div className='font-semibold'>Sync Error</div>
              <div className='text-xs'>{syncStatus.lastError}</div>
              {syncStatus.lastErrorAt && (
                <div className='text-xs opacity-70'>
                  {formatLastSync(syncStatus.lastErrorAt)}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className='text-sm font-semibold mb-2'>Sync Status</h3>
          {loading ? (
            <div className='text-sm text-base-content/70'>Loading...</div>
          ) : (
            <div className='space-y-2 text-sm'>
              <div>
                <span className='text-base-content/70'>Last sync: </span>
                <span>{formatLastSync(syncStatus.lastSyncAt)}</span>
              </div>
              {syncStatus.lastSyncCount !== null && (
                <div>
                  <span className='text-base-content/70'>
                    Last sync count:{' '}
                  </span>
                  <span>{syncStatus.lastSyncCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className='text-sm font-semibold mb-2'>Pending Review</h3>
          {loading ? (
            <div className='text-sm text-base-content/70'>Loading...</div>
          ) : (
            <div className='space-y-2'>
              <div className='text-sm'>
                <span className='text-base-content/70'>
                  Candidates pending:{' '}
                </span>
                <span className='font-semibold'>{syncStatus.pendingCount}</span>
              </div>
              {syncStatus.pendingCount > 0 && webUrl && (
                <button
                  onClick={openMatchingPage}
                  className='btn btn-primary btn-sm w-full mt-2'
                >
                  Review Matches
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
