import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eden } from '../../lib/api';
import { getSettings } from '../../lib/storage';
import { debug } from '../../lib/utils';

type CredentialsState = {
  hasCredentials: boolean;
  lastUpdateAt: number | null;
  loading: boolean;
  error: string | null;
};

const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  return date.toLocaleString();
};

export const CredentialsTab = () => {
  const [state, setState] = useState<CredentialsState>({
    hasCredentials: false,
    lastUpdateAt: null,
    loading: true,
    error: null,
  });

  const loadStatus = async () => {
    try {
      const settings = await getSettings();
      const api = eden(settings.apiUrl);

      const credentialsResponse = await api.api.settings['fansly-credentials'].get({
        fetch: {
          signal: AbortSignal.timeout(5000),
        },
      });

      if (credentialsResponse.error) {
        throw new Error('Failed to fetch credentials');
      }

      const credentialsData = credentialsResponse.data;
      const credentials = credentialsData?.credentials ?? null;

      const hasCredentials = !!(
        credentials &&
        typeof credentials === 'object' &&
        credentials !== null &&
        Object.keys(credentials).length > 0 &&
        (credentials.fanslyAuth || credentials.fanslySessionId)
      );

      const storageResult = await chrome.storage.local.get(['lastCredentialsUpdateAt']);
      const lastUpdateAt = storageResult.lastCredentialsUpdateAt ?? credentialsData?.lastUpdated ?? null;

      setState({
        hasCredentials,
        lastUpdateAt,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      setState({
        hasCredentials: false,
        lastUpdateAt: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  useEffect(() => {
    loadStatus();

    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local' && 'lastCredentialsUpdateAt' in changes) {
        setTimeout(() => {
          loadStatus();
        }, 500);
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      clearInterval(interval);
    };
  }, []);

  if (state.loading) {
    return (
      <div className='px-3 pt-3 pb-4'>
        <div className='card bg-base-100 border border-black'>
          <div className='card-body p-4'>
            <div className='flex items-center gap-2 text-sm text-base-content/60'>
              <span className='loading loading-spinner loading-xs'></span>
              <span>Checking credentials status...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className='px-3 pt-3 pb-4'>
        <div className='card bg-error/10 border border-error/20'>
          <div className='card-body p-4'>
            <div className='flex items-center gap-2 text-sm text-error'>
              <XCircle className='h-4 w-4' />
              <span>Error checking credentials: {state.error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-3 pt-3 pb-4'>
      <div className='space-y-4'>
        <div className='card bg-base-100 border border-black'>
          <div className='card-body p-4'>
            <div className='flex items-start gap-3'>
              {state.hasCredentials ? (
                <CheckCircle className='h-5 w-5 text-success flex-shrink-0 mt-0.5' />
              ) : (
                <XCircle className='h-5 w-5 text-error flex-shrink-0 mt-0.5' />
              )}
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-semibold mb-1'>
                  {state.hasCredentials ? 'Credentials Active' : 'No Credentials'}
                </div>
                <div className='text-xs text-base-content/60 flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  <span>Last received: {formatTimestamp(state.lastUpdateAt)}</span>
                </div>
                {state.hasCredentials && (
                  <div className='text-xs text-base-content/50 mt-2'>
                    Credentials are automatically captured when you browse Fansly
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!state.hasCredentials && (
          <div className='card bg-base-200 border border-base-300'>
            <div className='card-body p-4'>
              <div className='text-sm text-base-content/70'>
                <p className='mb-2'>
                  To capture credentials automatically:
                </p>
                <ol className='list-decimal list-inside space-y-1 text-xs'>
                  <li>Make sure you're logged into Fansly</li>
                  <li>Browse Fansly (open posts, timeline, etc.)</li>
                  <li>Credentials will be captured automatically</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

