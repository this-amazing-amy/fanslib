import { Check } from 'lucide-react';
import { ApiUrlInput } from './ApiUrlInput';
import { CredentialsStatus } from './CredentialsStatus';
import { LibraryPathInput } from './LibraryPathInput';
import { WebUrlInput } from './WebUrlInput';

type SettingsFormProps = {
  libraryPath: string;
  apiUrl: string;
  webUrl: string;
  saveStatus: 'idle' | 'saved';
  onLibraryPathChange: (value: string) => void;
  onApiUrlChange: (value: string) => void;
  onWebUrlChange: (value: string) => void;
  onSave: () => void;
};

export const SettingsForm = ({
  libraryPath,
  apiUrl,
  webUrl,
  saveStatus,
  onLibraryPathChange,
  onApiUrlChange,
  onWebUrlChange,
  onSave,
}: SettingsFormProps) => <div className='space-y-6 bg-base-200 rounded-xl p-6 mb-6'>
      <LibraryPathInput
        libraryPath={libraryPath}
        apiUrl={apiUrl}
        onChange={onLibraryPathChange}
      />

      <ApiUrlInput apiUrl={apiUrl} onChange={onApiUrlChange} />

      <WebUrlInput webUrl={webUrl} onChange={onWebUrlChange} />

      <div className='pt-2 border-t border-base-300'>
        <CredentialsStatus apiUrl={apiUrl} />
      </div>

      <div className='flex items-center gap-3 pt-2'>
        <button
          onClick={onSave}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 border-2 ${
            saveStatus === 'saved'
              ? 'bg-success/20 border-success text-success'
              : 'bg-primary text-primary-content hover:bg-primary/90 border-transparent'
          }`}
        >
          {saveStatus === 'saved' ? (
            <>
              <Check className='w-4 h-4' />
              Saved
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>;
