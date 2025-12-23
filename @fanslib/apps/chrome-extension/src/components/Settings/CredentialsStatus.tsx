import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eden } from '../../lib/api';
import { DEFAULT_API_URL } from '../../lib/storage';

type CredentialsStatusProps = {
  apiUrl: string;
};

type CredentialsState = {
  hasCredentials: boolean;
  lastUpdateAt: number | null;
  loading: boolean;
  error: string | null;
};

export const CredentialsStatus = ({ apiUrl }: CredentialsStatusProps) => {
  const [state, setState] = useState<CredentialsState>({
    hasCredentials: false,
    lastUpdateAt: null,
    loading: true,
    error: null,
  });

  const loadStatus = async () => {
    const urlToCheck = apiUrl.trim() || DEFAULT_API_URL;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const api = eden(urlToCheck);
      const credentialsResponse = await api.api.settings['fansly-credentials'].get({
        fetch: {
          signal: AbortSignal.timeout(5000),
        },
      });

      if (credentialsResponse.error) {
        throw new Error('Failed to fetch credentials');
      }

      const credentials = credentialsResponse.data;
      const hasCredentials = !!(
        credentials &&
        typeof credentials === 'object' &&
        (credentials.fanslyAuth || credentials.fanslySessionId)
      );

      const storageResult = await chrome.storage.local.get(['lastCredentialsUpdateAt']);
      const lastUpdateAt = storageResult.lastCredentialsUpdateAt ?? null;

      setState({
        hasCredentials,
        lastUpdateAt,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        hasCredentials: false,
        lastUpdateAt: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    loadStatus();

    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('lastCredentialsUpdateAt' in changes) {
        loadStatus();
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      clearInterval(interval);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, [apiUrl]);

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

  if (state.loading) {
    return (
      <div className='bg-base-200 rounded-xl p-4 border border-base-300'>
        <div className='flex items-center gap-2 text-sm text-base-content/60'>
          <Clock className='w-4 h-4 animate-pulse' />
          <span>Checking credentials status...</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className='bg-base-200 rounded-xl p-4 border border-error/20'>
        <div className='flex items-center gap-2 text-sm text-error'>
          <XCircle className='w-4 h-4' />
          <span>Error checking credentials: {state.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-base-200 rounded-xl p-4 border border-base-300'>
      <div className='flex items-start gap-3'>
        {state.hasCredentials ? (
          <CheckCircle className='w-5 h-5 text-success flex-shrink-0 mt-0.5' />
        ) : (
          <XCircle className='w-5 h-5 text-error flex-shrink-0 mt-0.5' />
        )}
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-medium mb-1'>
            {state.hasCredentials ? 'Credentials Active' : 'No Credentials'}
          </div>
          <div className='text-xs text-base-content/60 flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            <span>
              Last received: {formatTimestamp(state.lastUpdateAt)}
            </span>
          </div>
          {state.hasCredentials && (
            <div className='text-xs text-base-content/50 mt-2'>
              Credentials are automatically captured when you browse Fansly
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

