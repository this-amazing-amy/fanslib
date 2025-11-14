import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

const MediaRoute = () => {
  const { mediaId } = useParams({ from: '/library/$mediaId' });
  return (
    <div className="p-4">
      <div className="mb-2 text-sm text-base-content/70">
        <Link to="/library" className="link flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
      <h1 className="text-xl font-semibold">Media {mediaId}</h1>
      <p className="opacity-70">This route is registered. Implement media detail UI here.</p>
    </div>
  );
};

export const Route = createFileRoute('/library/$mediaId')({
  component: MediaRoute,
});


