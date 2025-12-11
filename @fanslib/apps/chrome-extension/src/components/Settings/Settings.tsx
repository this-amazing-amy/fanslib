import { useEffect, useState } from 'react';
import {
  DEFAULT_API_URL,
  DEFAULT_WEB_URL,
  getSettings,
  saveSettings,
} from '../../lib/storage';
import { HowToUse } from './HowToUse';
import { SettingsForm } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';

export const SettingsPage = () => {
  const [libraryPath, setLibraryPath] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [webUrl, setWebUrl] = useState(DEFAULT_WEB_URL);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();
    setLibraryPath(settings.libraryPath);
    setApiUrl(settings.apiUrl);
    setWebUrl(settings.webUrl);
  };

  const handleSave = async () => {
    await saveSettings({
      libraryPath: libraryPath.trim(),
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
      webUrl: webUrl.trim() || DEFAULT_WEB_URL,
    });

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className='min-h-screen bg-base-100 text-base-content'>
      <div className='max-w-4xl mx-auto px-6 py-8'>
        <SettingsHeader />

        <SettingsForm
          libraryPath={libraryPath}
          apiUrl={apiUrl}
          webUrl={webUrl}
          saveStatus={saveStatus}
          onLibraryPathChange={setLibraryPath}
          onApiUrlChange={setApiUrl}
          onWebUrlChange={setWebUrl}
          onSave={handleSave}
        />

        <HowToUse />
      </div>
    </div>
  );
};
