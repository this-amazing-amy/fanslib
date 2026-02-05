import { useCallback, useEffect, useState } from 'react';
import type { CandidateItem } from '../../content/fansly-interceptor';
import { eden } from '../../lib/api';
import { getSettings } from '../../lib/storage';
import { debug } from '../../lib/utils';

type SyncStatus = {
  lastSyncAt: number | null;
  lastSyncCreated: number | null;
  lastSyncExisting: number | null;
  lastSyncAlreadyMatched: number | null;
  pendingCount: number;
  lastError: string | null;
  lastErrorAt: number | null;
  isSyncing: boolean;
};

type PostStatus = {
  synced: boolean;
  candidateStatus: 'pending' | 'matched' | 'ignored' | null;
  syncedAt?: number;
};

export const StatisticsTab = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    lastSyncCreated: null,
    lastSyncExisting: null,
    lastSyncAlreadyMatched: null,
    pendingCount: 0,
    lastError: null,
    lastErrorAt: null,
    isSyncing: false,
  });
  const [loading, setLoading] = useState(true);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<CandidateItem[]>([]);
  const [postStatuses, setPostStatuses] = useState<Map<string, PostStatus>>(
    new Map()
  );

  const loadPostStatuses = useCallback(
    async (candidatesToCheck?: CandidateItem[]) => {
      const candidates = candidatesToCheck ?? recentCandidates;
      if (candidates.length === 0) return;

      try {
        const settings = await getSettings();
        const api = eden(settings.apiUrl);

        const response = await api.api.analytics.candidates.$get({
          query: {},
        });

        if (!response.ok) {
          debug('warn', 'Failed to load candidate statuses', {
            component: 'StatisticsTab',
            action: 'loadPostStatuses',
          });
          return;
        }

        const data = await response.json();
        const allCandidates = data.items ?? [];
        const statusMap = new Map<string, PostStatus>();

        candidates.forEach((candidate) => {
          const foundCandidate = allCandidates.find(
            (c: { fanslyStatisticsId: string }) => c.fanslyStatisticsId === candidate.fanslyStatisticsId
          );

          if (foundCandidate) {
            statusMap.set(candidate.fanslyStatisticsId, {
              synced: true,
              candidateStatus: foundCandidate.status,
              syncedAt: foundCandidate.capturedAt
                ? new Date(foundCandidate.capturedAt).getTime()
                : undefined,
            });
          } else {
            statusMap.set(candidate.fanslyStatisticsId, {
              synced: false,
              candidateStatus: null,
            });
          }
        });

        setPostStatuses(statusMap);
      } catch (error) {
        debug('error', 'Failed to load post statuses', {
          component: 'StatisticsTab',
          action: 'loadPostStatuses',
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [recentCandidates]
  );

  const loadRecentCandidates = useCallback(async (): Promise<
    CandidateItem[]
  > => {
    try {
      const result = await chrome.storage.local.get(['recentCandidates']);
      const candidates =
        (result.recentCandidates as CandidateItem[] | undefined) ?? [];
      setRecentCandidates(candidates);
      return candidates;
    } catch (error) {
      debug('error', 'Failed to load recent candidates', {
        component: 'StatisticsTab',
        action: 'loadRecentCandidates',
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }, []);

  const loadStatus = useCallback(async () => {
    debug('debug', 'Starting to load statistics status', {
      component: 'StatisticsTab',
      action: 'loadStatus',
    });

    try {
      const settings = await getSettings();
      setWebUrl(settings.webUrl);

      const storage = await chrome.storage.local.get([
        'lastSyncAt',
        'lastSyncCreated',
        'lastSyncExisting',
        'lastSyncAlreadyMatched',
        'lastSyncError',
        'lastSyncErrorAt',
        'isSyncing',
      ]);

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: storage.lastSyncAt ?? null,
        lastSyncCreated: storage.lastSyncCreated ?? null,
        lastSyncExisting: storage.lastSyncExisting ?? null,
        lastSyncAlreadyMatched: storage.lastSyncAlreadyMatched ?? null,
        lastError: storage.lastSyncError ?? null,
        lastErrorAt: storage.lastSyncErrorAt ?? null,
        isSyncing: storage.isSyncing ?? false,
      }));

      const api = eden(settings.apiUrl);
      const response = await api.api.analytics.candidates.$get({
        query: { status: 'pending', limit: '1' },
      });

      if (response.ok) {
        const data = await response.json();
        const pendingCount = data.total ?? 0;
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
    }
  }, []);

  useEffect(() => {
    debug('info', 'StatisticsTab mounted, loading status', {
      component: 'StatisticsTab',
      action: 'mount',
    });
    loadStatus();
    loadRecentCandidates().then((candidates) => {
      if (candidates && candidates.length > 0) {
        loadPostStatuses(candidates);
      }
    });

    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local') {
        if (changes.recentCandidates) {
          const newCandidates = Array.isArray(changes.recentCandidates.newValue)
            ? (changes.recentCandidates.newValue as CandidateItem[])
            : [];
          setRecentCandidates(newCandidates);
          if (newCandidates.length > 0) {
            loadPostStatuses(newCandidates);
          }
        }
        if (
          changes.lastSyncAt ||
          changes.isSyncing ||
          changes.lastSyncCreated
        ) {
          loadStatus();
          loadPostStatuses();
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    const statusRefreshInterval = setInterval(() => {
      loadPostStatuses();
    }, 30000);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      clearInterval(statusRefreshInterval);
    };
  }, [loadPostStatuses, loadRecentCandidates, loadStatus]);

  const formatDate = (timestamp: number): string => {
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);
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

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return formatDate(timestamp);
  };

  const clearError = async () => {
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
    if (webUrl) {
      chrome.tabs.create({ url: `${webUrl}/analytics/matching` });
    }
  };

  const refreshAll = async () => {
    const candidates = await loadRecentCandidates();
    if (candidates.length > 0) {
      await loadPostStatuses(candidates);
    }
  };

  const getPostStatus = (statisticsId: string): PostStatus =>
    postStatuses.get(statisticsId) ?? {
      synced: false,
      candidateStatus: null,
    };

  const getSyncBadge = (status: PostStatus) => {
    if (!status.synced) {
      return (
        <span className='badge badge-xs badge-ghost text-base-content/50'>
          Not synced
        </span>
      );
    }
    return (
      <span className='badge badge-xs badge-info'>
        Synced {status.syncedAt ? formatDate(status.syncedAt) : ''}
      </span>
    );
  };

  const getMatchBadge = (status: PostStatus) => {
    if (!status.synced || !status.candidateStatus) {
      return (
        <span className='badge badge-xs badge-ghost text-base-content/50'>
          Not matched
        </span>
      );
    }
    if (status.candidateStatus === 'matched') {
      return <span className='badge badge-xs badge-success'>Matched</span>;
    }
    if (status.candidateStatus === 'pending') {
      return <span className='badge badge-xs badge-warning'>Pending</span>;
    }
    if (status.candidateStatus === 'ignored') {
      return (
        <span className='badge badge-xs badge-ghost text-base-content/50'>
          Ignored
        </span>
      );
    }
    return null;
  };

  return (
    <div className='px-3 pt-3 pb-4'>
      <div className='space-y-6'>
        {syncStatus.lastError && (
          <div className='card bg-error/10 border border-black'>
            <div className='card-body p-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1'>
                  <div className='font-semibold text-error text-sm'>
                    Sync Error
                  </div>
                  <div className='text-xs text-error/80 mt-1'>
                    {syncStatus.lastError}
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className='btn btn-ghost btn-xs btn-circle'
                  aria-label='Dismiss error'
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <div className='card bg-base-100 border border-black'>
          <div className='card-body p-4'>
            <h3 className='text-sm font-semibold mb-3'>Sync Status</h3>
            {loading ? (
              <div className='text-sm text-base-content/70'>Loading...</div>
            ) : (
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='text-base-content/70'>Status: </span>
                  {syncStatus.isSyncing ? (
                    <span className='flex items-center gap-1 text-blue-500'>
                      <span className='loading loading-spinner loading-xs'></span>
                      Syncing...
                    </span>
                  ) : syncStatus.lastSyncAt ? (
                    <span className='text-green-500 font-medium'>✓ Synced</span>
                  ) : (
                    <span className='text-base-content/50'>Not synced</span>
                  )}
                </div>
                {syncStatus.lastSyncAt && (
                  <div>
                    <span className='text-base-content/70'>Last sync: </span>
                    <span>{formatLastSync(syncStatus.lastSyncAt)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='card bg-base-100 border border-black'>
          <div className='card-body p-4'>
            <h3 className='text-sm font-semibold mb-3'>Pending Review</h3>
            {loading ? (
              <div className='text-sm text-base-content/70'>Loading...</div>
            ) : (
              <div className='space-y-2'>
                <div className='text-sm'>
                  <span className='text-base-content/70'>
                    Candidates pending:{' '}
                  </span>
                  <span className='font-semibold'>
                    {syncStatus.pendingCount}
                  </span>
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

        <div className='card bg-base-100 border border-black'>
          <div className='card-body p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold'>
                Posts Found ({recentCandidates.length})
              </h3>
              <button
                onClick={refreshAll}
                className='btn btn-ghost btn-xs'
                title='Refresh posts and status'
              >
                ↻
              </button>
            </div>
            {recentCandidates.length === 0 ? (
              <div className='text-sm text-base-content/70'>
                Browse Fansly to start finding posts.
              </div>
            ) : (
              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {recentCandidates.slice(0, 20).map((candidate) => {
                  const status = getPostStatus(candidate.fanslyStatisticsId);
                  return (
                    <div
                      key={candidate.fanslyStatisticsId}
                      className='p-3 bg-base-200 rounded-lg border border-base-300'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div
                            className='font-medium truncate text-sm'
                            title={candidate.filename}
                          >
                            {candidate.filename}
                          </div>
                          {candidate.caption && (
                            <div
                              className='text-xs text-base-content/60 truncate mt-1'
                              title={candidate.caption}
                            >
                              {candidate.caption}
                            </div>
                          )}
                          <div className='flex items-center gap-2 mt-2 flex-wrap'>
                            <span className='badge badge-xs'>
                              {candidate.mediaType}
                            </span>
                            {getSyncBadge(status)}
                            {getMatchBadge(status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {recentCandidates.length > 20 && (
                  <div className='text-xs text-base-content/60 text-center py-2'>
                    Showing 20 of {recentCandidates.length} posts
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
