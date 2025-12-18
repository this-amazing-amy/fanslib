import { Heart } from 'lucide-react';

export const SettingsHeader = () => (
  <div className='flex items-center gap-4 mb-8'>
    <div
      className='w-12 h-12 rounded-xl flex items-center justify-center'
      style={{ backgroundColor: 'rgb(229, 214, 254)' }}
    >
      <Heart className='w-6 h-6 text-white fill-white' />
    </div>
    <div>
      <h1 className='text-2xl font-bold'>FansLib Queue Settings</h1>
      <p className='text-sm text-base-content/60'>
        Configure your extension preferences
      </p>
    </div>
  </div>
);
