import { Inbox } from 'lucide-react';

export const EmptyState = () => (
  <div className='flex flex-col items-center justify-center flex-1 min-h-0 px-4 text-center'>
    <Inbox className='w-12 h-12 mb-3 text-base-content/40' />
    <div className='text-base mb-2 font-medium'>Queue is empty</div>
    <div className='text-xs text-base-content/60 max-w-[280px]'>
      Mark posts as &quot;Ready&quot; in FansLib to add them to the queue
    </div>
  </div>
);
