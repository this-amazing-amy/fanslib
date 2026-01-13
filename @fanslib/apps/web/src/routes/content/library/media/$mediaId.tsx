import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { MediaView } from '~/components/MediaView';
import { RevealInFinderButton } from '~/components/RevealInFinderButton';
import { MediaDetailDotsMenu } from '~/components/media-detail/MediaDetailDotsMenu';
import { MediaDetailMetadata } from '~/components/media-detail/MediaDetailMetadata';
import { MediaDetailNavigation } from '~/components/media-detail/MediaDetailNavigation';
import { MediaPosts } from '~/components/media-detail/MediaPosts';
import { CreatePostDialog } from '~/features/library/components/CreatePostDialog';
import { Button } from '~/components/ui/Button';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { MediaTagEditor } from '~/features/library/components/MediaTagEditor';
import { useMediaQuery } from '~/lib/queries/library';

const MediaRoute = () => {
  const { mediaId } = useParams({ from: '/content/library/media/$mediaId' });
  const router = useRouter();
  const { data: media, isLoading, error } = useMediaQuery({ id: mediaId });
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold mb-4">Media not found</h1>
        <Button variant="ghost" onClick={() => router.history.back()}>Back to Library</Button>
      </div>
    );
  }

  return (
    <MediaSelectionProvider media={[media]}>
      <div className="overflow-y-auto">
        <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
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
              <MediaDetailDotsMenu
                id={media.id}
                mediaType={media.type}
                onCreatePost={() => setCreatePostDialogOpen(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-6">
            <div
              className="rounded-2xl bg-base-300 aspect-square overflow-hidden"
              style={{ viewTransitionName: `media-${media.id}` }}
            >
              <MediaView media={media} controls />
            </div>
            <div className="flex flex-col gap-6">
              <MediaTagEditor media={[media]} />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Posts</h3>
            <Button
              variant="primary"
              size="icon"
              onPress={() => setCreatePostDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            <MediaPosts mediaId={media.id} />
          </div>

          <div className="mt-8">
            <MediaDetailMetadata media={media} />
          </div>
          <CreatePostDialog
            open={createPostDialogOpen}
            onOpenChange={setCreatePostDialogOpen}
            media={[media]}
          />
        </div>
      </div>
    </MediaSelectionProvider>
  );
};

export const Route = createFileRoute('/content/library/media/$mediaId')({
  component: MediaRoute,
});

