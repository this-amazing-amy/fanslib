import { CHANNEL_TYPES } from '@fanslib/server/constants';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { eden } from '../../lib/api';
import { DEFAULT_API_URL } from '../../lib/storage';

type ApiUrlInputProps = {
  apiUrl: string;
  onChange: (value: string) => void;
};

export const ApiUrlInput = ({ apiUrl, onChange }: ApiUrlInputProps) => {
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
      setTestMessage(`Connected! ${data.length} post(s) ready.`);
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 2000);
    } catch (err) {
      setTestStatus('error');
      setTestMessage(
        `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div>
      <label htmlFor='api-url' className='block text-sm font-medium mb-2'>
        API URL
      </label>
      <div className='flex gap-2'>
        <input
          type='text'
          id='api-url'
          value={apiUrl}
          onChange={(e) => {
            onChange(e.target.value);
            setTestStatus('idle');
            setTestMessage('');
          }}
          placeholder={DEFAULT_API_URL}
          className='flex-1 px-4 py-2 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base-content placeholder-base-content/40'
        />
        <button
          onClick={handleTestConnection}
          disabled={testStatus === 'testing'}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-2 ${
            testStatus === 'success'
              ? 'bg-success/20 border-success text-success'
              : 'bg-base-100 hover:bg-base-200 border-transparent text-base-content'
          }`}
        >
          {testStatus === 'testing' ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              Testing...
            </>
          ) : testStatus === 'success' ? (
            <>
              <Check className='w-4 h-4' />
              Connected
            </>
          ) : (
            'Test'
          )}
        </button>
      </div>
      {testMessage && testStatus === 'error' && (
        <div className='mt-2 px-4 py-2 rounded-lg text-sm bg-error/20 text-error flex items-center gap-2'>
          <X className='w-4 h-4' />
          {testMessage}
        </div>
      )}
      <p className='text-xs text-base-content/50 mt-1'>
        FansLib server URL (default: {DEFAULT_API_URL})
      </p>
    </div>
  );
};
