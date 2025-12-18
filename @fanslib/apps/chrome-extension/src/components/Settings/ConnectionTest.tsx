import { CHANNEL_TYPES } from '@fanslib/server/constants';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { eden } from '../../lib/api';
import { DEFAULT_API_URL } from '../../lib/storage';

type ConnectionTestProps = {
  apiUrl: string;
};

export const ConnectionTest = ({ apiUrl }: ConnectionTestProps) => {
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    const urlToTest = apiUrl.trim() || DEFAULT_API_URL;
    setTestStatus('testing');
    setTestMessage('');

    try {
      const api = eden(urlToTest);
      const response = await api.api.posts.all.get({
        query: {
          filters: JSON.stringify({
            statuses: ['ready'],
            channelTypes: [CHANNEL_TYPES.fansly.id],
          }),
        },
        fetch: {
          signal: AbortSignal.timeout(5000),
        },
      });

      if (response.error) {
        throw new Error(`Server returned error`);
      }

      const data = response.data ?? [];
      setTestStatus('success');
      setTestMessage(`Connected successfully! ${data.length} post(s) ready.`);
    } catch (err) {
      setTestStatus('error');
      setTestMessage(
        `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='bg-base-200 rounded-xl p-6 mb-6'>
      <h2 className='text-lg font-semibold mb-4'>Connection Test</h2>
      <button
        onClick={handleTestConnection}
        disabled={testStatus === 'testing'}
        className='px-6 py-2 bg-base-100 border border-base-300 text-base-content rounded-lg font-medium hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
      >
        {testStatus === 'testing' && (
          <Loader2 className='w-4 h-4 animate-spin' />
        )}
        {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
      </button>

      {testMessage && (
        <div
          className={`mt-3 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            testStatus === 'success'
              ? 'bg-success/20 text-success'
              : 'bg-error/20 text-error'
          }`}
        >
          {testStatus === 'success' ? (
            <Check className='w-4 h-4' />
          ) : (
            <X className='w-4 h-4' />
          )}
          {testMessage}
        </div>
      )}
    </div>
  );
};
