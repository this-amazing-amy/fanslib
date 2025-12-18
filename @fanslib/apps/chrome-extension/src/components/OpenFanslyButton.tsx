import { ChevronRight } from 'lucide-react';

type OpenFanslyButtonProps = {
  onClick: () => void;
};

export const OpenFanslyButton = ({ onClick }: OpenFanslyButtonProps) => <button
      onClick={onClick}
      className='w-full mt-4 px-4 py-2.5 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2'
    >
      Open Fansly.com
      <ChevronRight className='w-4 h-4' />
    </button>;
