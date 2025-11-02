import { createFileRoute } from '@tanstack/react-router';
import { useSettingsQuery } from '~/lib/queries/settings';

export const LibraryPage = () => {
    const { data: settings, isLoading } = useSettingsQuery();

    console.log(settings);

  if (isLoading) {
    return <div className='flex items-center justify-center h-full'>Loading...</div>;
  }

  if (!settings?.libraryPath) {
    return <div className='flex items-center justify-center h-full'>No library path found</div>;
  }

  return <div className='flex items-center justify-center h-full'>Library</div>;
};

export const Route = createFileRoute('/library/')({
  component: LibraryPage,
});