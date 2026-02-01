import type { PostWithRelations } from '@fanslib/server/schemas';
import { useState } from 'react';
import { MediaPreview } from '~/components/MediaPreview';
import { Button } from '~/components/ui/Button';
import {
    Dialog,
    DialogFooter,
    DialogHeader,
    DialogModal,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/Dialog';
import { cn } from '~/lib/cn';

type Post = PostWithRelations;

type SelectPostMediaDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  candidateFilename: string;
  onSelect: (postMediaId: string) => void;
  matchedPostMediaIds?: Set<string>;
};

export const SelectPostMediaDialog = ({
  isOpen,
  onOpenChange,
  post,
  candidateFilename,
  onSelect,
  matchedPostMediaIds,
}: SelectPostMediaDialogProps) => {
  const unmatchedPostMedia = post.postMedia.filter((pm) => !matchedPostMediaIds?.has(pm.id));
  const [selectedPostMediaId, setSelectedPostMediaId] = useState<string | null>(
    unmatchedPostMedia[0]?.id ?? null
  );

  const handleSelect = () => {
    if (selectedPostMediaId) {
      onSelect(selectedPostMediaId);
      onOpenChange(false);
    }
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogModal>
        <Dialog maxWidth="2xl" className="max-h-[80vh] flex flex-col">
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Select Media to Match</DialogTitle>
                <p className="text-sm text-base-content/70 mt-2">
                  No matching media found for &quot;{candidateFilename}&quot;. Please select which media from this post should be matched with this candidate.
                </p>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {post.postMedia.map((postMedia) => {
                    const isMatched = matchedPostMediaIds?.has(postMedia.id) ?? false;
                    const isSelected = selectedPostMediaId === postMedia.id;
                    return (
                      <button
                        key={postMedia.id}
                        onClick={() => !isMatched && setSelectedPostMediaId(postMedia.id)}
                        disabled={isMatched}
                        className={cn(
                          'flex flex-col gap-2 p-3 rounded-lg border-2 transition-all',
                          isMatched
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-base-200 cursor-pointer',
                          isSelected && !isMatched
                            ? 'border-primary bg-primary/10'
                            : 'border-base-300'
                        )}
                      >
                        <MediaPreview
                          media={postMedia.media}
                          className="w-full aspect-square"
                        />
                        <div className="text-xs text-center">
                          <div className="font-medium truncate">{postMedia.media.name}</div>
                          {isMatched && (
                            <div className="text-base-content/50 text-[10px] mt-0.5">Already matched</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  onPress={handleSelect}
                  isDisabled={!selectedPostMediaId}
                >
                  Match Selected Media
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

