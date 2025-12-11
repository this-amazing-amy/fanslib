import { DEFAULT_WEB_URL } from '../../lib/storage';

type WebUrlInputProps = {
  webUrl: string;
  onChange: (value: string) => void;
};

export const WebUrlInput = ({ webUrl, onChange }: WebUrlInputProps) => {
  return (
    <div>
      <label htmlFor='web-url' className='block text-sm font-medium mb-2'>
        Web URL
      </label>
      <input
        type='text'
        id='web-url'
        value={webUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_WEB_URL}
        className='w-full px-4 py-2 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base-content placeholder-base-content/40'
      />
      <p className='text-xs text-base-content/50 mt-1'>
        FansLib web app URL (default: {DEFAULT_WEB_URL})
      </p>
    </div>
  );
};
