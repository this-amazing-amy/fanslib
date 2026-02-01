import type { Media, PostWithRelations } from '@fanslib/server/schemas';
import { Link } from '@tanstack/react-router';
import { ExternalLink, Plus, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { MediaView } from '~/components/MediaView';
import { RevealInFinderButton } from '~/components/RevealInFinderButton';
import { Button } from '~/components/ui/Button';
import {
    Dialog,
    DialogFooter,
    DialogHeader,
    DialogModal,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/Dialog';
import { MediaSelectionProvider } from '~/contexts/MediaSelectionContext';
import { CombinedMediaSelection } from '~/features/library/components/CombinedMediaSelection';
import { cn } from '~/lib/cn';
import { useAddMediaToPostMutation, useRemoveMediaFromPostMutation } from '~/lib/queries/posts';


type Post = PostWithRelations;

type PostDetailMediaProps = {
  post: Post;
};

export const PostDetailMedia = ({ post }: PostDetailMediaProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const removeMediaMutation = useRemoveMediaFromPostMutation();
  const addMediaMutation = useAddMediaToPostMutation();

  const removeMediaFromPost = async (postMediaId: string) => {
    const postMediaItem = post.postMedia.find((pm) => pm.id === postMediaId);
    if (!postMediaItem) return;

    try {
      await removeMediaMutation.mutateAsync({
        id: post.id,
        mediaIds: [postMediaItem.media.id],
      });
      setConfirmingDelete(null);
    } catch (error) {
      console.error('Failed to remove media from post:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', mediaId);
  };

  const handleMediaSelect = (media: Media) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);
      return isSelected ? prev.filter((m) => m.id !== media.id) : [...prev, media];
    });
  };

  const handleAddMedia = async () => {
    if (selectedMedia.length === 0) return;
    await addMediaMutation.mutateAsync({
      id: post.id,
      mediaIds: selectedMedia.map((m) => m.id),
    });
    setSelectedMedia([]);
    setIsAddMediaOpen(false);
  };

  const existingMediaIds = post.postMedia.map((pm) => pm.media.id);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {post.postMedia.map((postMedia) => (
        <div
          key={postMedia.id}
          className="group relative aspect-square rounded-2xl overflow-hidden bg-base-300"
          style={{ viewTransitionName: `media-${postMedia.media.id}` }}
          draggable
          onDragStart={(e) => handleDragStart(e, postMedia.media.id)}
        >
          <MediaView media={postMedia.media} controls />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Link
              to="/content/library/media/$mediaId"
              params={{ mediaId: postMedia.media.id }}
              className="inline-flex items-center justify-center rounded-full text-sm font-medium h-8 w-8 backdrop-blur-sm bg-base-100/80 hover:bg-base-200/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <RevealInFinderButton
              relativePath={postMedia.media.relativePath}
              className="backdrop-blur-sm bg-base-100/80 h-8 w-8"
            />
            <Button
              variant={confirmingDelete === postMedia.id ? 'error' : 'ghost'}
              size="icon"
              onClick={() => {
                if (confirmingDelete === postMedia.id) {
                  removeMediaFromPost(postMedia.id);
                } else {
                  setConfirmingDelete(postMedia.id);
                }
              }}
              onMouseLeave={() => setConfirmingDelete(null)}
              isDisabled={removeMediaMutation.isPending}
              className="backdrop-blur-sm bg-base-100/80 h-8 w-8"
            >
              <Trash2Icon className="h-4 w-4" />
              {confirmingDelete === postMedia.id && (
                <span className="ml-1">
                  {removeMediaMutation.isPending ? '...' : 'Sure?'}
                </span>
              )}
            </Button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setIsAddMediaOpen(true)}
        className={cn(
          'aspect-square rounded-2xl border-2 border-dashed border-base-300',
          'flex items-center justify-center',
          'hover:border-primary hover:bg-primary/10 transition-colors',
          'cursor-pointer'
        )}
      >
        <div className="flex flex-col items-center gap-2 text-base-content/60">
          <Plus className="h-8 w-8" />
          <span className="text-sm">Add Media</span>
        </div>
      </button>

      <MediaSelectionProvider media={selectedMedia}>
        <DialogTrigger isOpen={isAddMediaOpen} onOpenChange={setIsAddMediaOpen}>
          <DialogModal>
            <Dialog maxWidth="3xl" className="max-h-[80vh] flex flex-col">
              {({ close }) => (
                <>
                  <DialogHeader>
                    <DialogTitle>Add Media to Post</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <CombinedMediaSelection
                      selectedMedia={selectedMedia}
                      onMediaSelect={handleMediaSelect}
                      excludeMediaIds={existingMediaIds}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onPress={close}>
                      Cancel
                    </Button>
                    <Button
                      onPress={handleAddMedia}
                      isDisabled={selectedMedia.length === 0 || addMediaMutation.isPending}
                    >
                      {addMediaMutation.isPending
                        ? 'Adding...'
                        : `Add ${selectedMedia.length} media`}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </Dialog>
          </DialogModal>
        </DialogTrigger>
      </MediaSelectionProvider>
    </div>
  );
};

