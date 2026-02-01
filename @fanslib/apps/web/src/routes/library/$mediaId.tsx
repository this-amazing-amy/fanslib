import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { MediaView } from '~/components/MediaView';
import { RevealInFinderButton } from '~/components/RevealInFinderButton';
import { MediaDetailDotsMenu } from '~/components/media-detail/MediaDetailDotsMenu';
import { MediaDetailMetadata } from '~/components/media-detail/MediaDetailMetadata';
import { MediaDetailNavigation } from '~/components/media-detail/MediaDetailNavigation';
import { MediaPosts } from '~/components/media-detail/MediaPosts';
import { Button } from '~/components/ui/Button';
import { LibraryPreferencesProvider } from '~/contexts/LibraryPreferencesContext';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { MediaTagEditor } from '~/features/library/components/MediaTagEditor';
import { useMediaQuery } from '~/lib/queries/library';

const MediaRoute = () => {
  const { mediaId } = useParams({ from: '/library/$mediaId' });
  const navigate = useNavigate();
  const { data: media, isLoading, error } = useMediaQuery({ id: mediaId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !media || 'error' in media) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold mb-4">Media not found</h1>
        <Button variant="ghost" onClick={() => navigate({ to: "/library" })}>Back to Library</Button>
      </div>
    );
  }

  const mediaWithDates = media as unknown as typeof media & { createdAt: Date; updatedAt: Date; fileCreationDate: Date; fileModificationDate: Date };

  return (
    <LibraryPreferencesProvider>
      <MediaSelectionProvider media={[mediaWithDates]}>
        <div className="overflow-y-auto">
          <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/library" })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex-1" />
              <MediaDetailNavigation />
            </div>
            <div className="flex justify-between">
              <h1 className="text-3xl font-semibold tracking-tight">{media.name}</h1>
              <div className="flex gap-2">
                <RevealInFinderButton relativePath={media.relativePath} />
                <MediaDetailDotsMenu id={media.id} mediaType={media.type} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-6">
              <div className="rounded-2xl bg-base-300 aspect-square overflow-hidden">
                <MediaView media={mediaWithDates} controls />
              </div>
              <div className="flex flex-col gap-6">
                <MediaDetailMetadata media={mediaWithDates} />
                <MediaTagEditor media={[mediaWithDates]} />
              </div>
            </div>

            <h3 className="text-lg font-medium mb-4">Posts</h3>
            <div className="flex flex-col gap-4">
              <MediaPosts mediaId={media.id} />
            </div>
          </div>
        </div>
      </MediaSelectionProvider>
    </LibraryPreferencesProvider>
  );
};

export const Route = createFileRoute('/library/$mediaId')({
  component: MediaRoute,
});


