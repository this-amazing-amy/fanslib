import { Settings as SettingsIcon } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';

type PopupHeaderProps = {
  postCount: number;
  currentIndex: number;
  connectionStatus: 'loading' | 'connected' | 'error';
  errorMessage: string | null;
  onOpenSettings: () => void;
};

export const PopupHeader = ({
  postCount,
  currentIndex,
  connectionStatus,
  errorMessage,
  onOpenSettings,
}: PopupHeaderProps) => {
  return (
    <div className='flex items-center gap-3 px-3 py-2 border-b border-base-300 justify-between'>
      <div className='flex items-center gap-3'>
        <div className='w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-lg font-bold text-primary-content'>
          FL
        </div>
        {postCount > 0 && (
          <div className='text-xs text-base-content/60'>
            {postCount} post{postCount !== 1 ? 's' : ''} ready
          </div>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <ConnectionStatus
          status={connectionStatus}
          errorMessage={errorMessage}
        />
        <button
          onClick={onOpenSettings}
          className='p-1.5 rounded-lg hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors cursor-pointer'
          title='Settings'
        >
          <SettingsIcon className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};
