import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { Plus, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { MediaView } from '~/components/MediaView';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/cn';
import { useRemoveMediaFromPostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailMediaProps = {
  post: Post;
};

export const PostDetailMedia = ({ post }: PostDetailMediaProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const removeMediaMutation = useRemoveMediaFromPostMutation();

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {post.postMedia.map((postMedia, index) => (
        <div
          key={postMedia.id}
          className="group relative aspect-square rounded-2xl overflow-hidden bg-base-300"
          draggable
          onDragStart={(e) => handleDragStart(e, postMedia.media.id)}
        >
          <MediaView media={postMedia.media} controls />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant={confirmingDelete === postMedia.id ? 'error' : 'ghost'}
              size="sm"
              onClick={() => {
                if (confirmingDelete === postMedia.id) {
                  removeMediaFromPost(postMedia.id);
                } else {
                  setConfirmingDelete(postMedia.id);
                }
              }}
              onMouseLeave={() => setConfirmingDelete(null)}
              isDisabled={removeMediaMutation.isPending}
              className="backdrop-blur-sm bg-base-100/80"
            >
              <Trash2Icon className="h-4 w-4" />
              {confirmingDelete === postMedia.id && (
                <span className="ml-1">
                  {removeMediaMutation.isPending ? '...' : 'Sure?'}
                </span>
              )}
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 text-xs bg-base-100/80 backdrop-blur-sm px-2 py-1 rounded">
            {index + 1} of {post.postMedia.length}
          </div>
        </div>
      ))}
      <button
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
    </div>
  );
};

