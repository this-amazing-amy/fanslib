import { ChevronLeft, ChevronRight } from 'lucide-react';

type PostNavigationProps = {
  currentIndex: number;
  totalPosts: number;
  onPrevious: () => void;
  onNext: () => void;
};

export const PostNavigation = ({
  currentIndex,
  totalPosts,
  onPrevious,
  onNext,
}: PostNavigationProps) => {
  if (totalPosts <= 1) return null;

  return (
    <div className='flex items-center gap-2 mt-4'>
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className='flex-1 px-4 py-2 bg-base-200 text-base-content rounded-lg font-medium hover:bg-base-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1'
      >
        <ChevronLeft className='w-4 h-4' />
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={currentIndex === totalPosts - 1}
        className='flex-1 px-4 py-2 bg-base-200 text-base-content rounded-lg font-medium hover:bg-base-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1'
      >
        Next
        <ChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
};
