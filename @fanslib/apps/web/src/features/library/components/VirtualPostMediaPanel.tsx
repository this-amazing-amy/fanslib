import type { Media } from '@fanslib/server/schemas';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChannelBadge } from '~/components/ChannelBadge';
import { ContentScheduleBadge } from '~/components/ContentScheduleBadge';
import { useCreatePostMutation } from '~/lib/queries/posts';
import type { VirtualPost } from '~/lib/virtual-posts';
import { CombinedMediaSelection } from './CombinedMediaSelection';

type VirtualPostMediaPanelProps = {
  virtualPost: VirtualPost;
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  cardBounds?: DOMRect;
};

export const VirtualPostMediaPanel = ({
  virtualPost,
  isOpen,
  onClose,
  onExpand,
  cardBounds,
}: VirtualPostMediaPanelProps) => {
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const { mutateAsync: createPost } = useCreatePostMutation();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMediaSelect = (media: Media) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== media.id);
      }
      return [...prev, media];
    });
  };

  const handleCreatePost = useCallback(async () => {
    if (selectedMedia.length === 0) return;

    try {
      await createPost({
        date: virtualPost.date,
        channelId: virtualPost.channelId,
        status: 'draft',
        caption: null,
        mediaIds: selectedMedia.map((m) => m.id),
        scheduleId: virtualPost.scheduleId ?? undefined,
        subredditId: undefined,
      });

      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }, [selectedMedia, virtualPost, createPost, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleCreatePost();
    }
  }, [onClose, handleCreatePost]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const layoutId = `virtual-post-${virtualPost.date}-${virtualPost.channelId}`;

  const panel = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Panel */}
        <motion.div
          layoutId={cardBounds ? layoutId : undefined}
          className="relative z-10 flex flex-col bg-base-100 rounded-lg shadow-xl overflow-hidden"
          style={{
            width: '42rem',
            maxWidth: '85vw',
            height: '32rem',
            maxHeight: '32rem',
          }}
          initial={
            cardBounds && !prefersReducedMotion
              ? {
                  x: cardBounds.left + cardBounds.width / 2 - window.innerWidth / 2,
                  y: cardBounds.top + cardBounds.height / 2 - window.innerHeight / 2,
                  width: cardBounds.width,
                  height: cardBounds.height,
                }
              : undefined
          }
          animate={{
            x: 0,
            y: 0,
            width: '42rem',
            height: '32rem',
          }}
          exit={
            cardBounds && !prefersReducedMotion
              ? {
                  x: cardBounds.left + cardBounds.width / 2 - window.innerWidth / 2,
                  y: cardBounds.top + cardBounds.height / 2 - window.innerHeight / 2,
                  width: cardBounds.width,
                  height: cardBounds.height,
                }
              : undefined
          }
          transition={{
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Header */}
          <motion.div
            className="flex items-center justify-between p-3 border-b border-base-300"
            initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            <div className="flex items-center gap-2">
              {/* Date/Time */}
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">
                  {format(new Date(virtualPost.date), 'EEE, MMM d')}
                </div>
                <div className="text-xs text-base-content/70">
                  {format(new Date(virtualPost.date), 'h:mm a')}
                </div>
              </div>

              {/* Schedule Badge */}
              {virtualPost.schedule && (
                <ContentScheduleBadge
                  name={virtualPost.schedule.name}
                  emoji={virtualPost.schedule.emoji}
                  color={virtualPost.schedule.color}
                  size="sm"
                />
              )}

              {/* Channel Badge */}
              <ChannelBadge
                name={virtualPost.channel.name}
                typeId={virtualPost.channel.typeId}
                size="sm"
              />
            </div>

            {/* Close Button */}
            <button
              className="btn btn-sm btn-ghost btn-circle"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            {/* Media Selection Grid */}
            <div className="p-3">
              <CombinedMediaSelection
                selectedMedia={selectedMedia}
                onMediaSelect={handleMediaSelect}
                scheduleId={virtualPost.scheduleId ?? undefined}
                channelId={virtualPost.channelId}
                autoApplyFilters={true}
                pageLimit={8}
              />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="flex items-center justify-end gap-2 p-3 border-t border-base-300 bg-base-200"
            initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            {/* Selected Count */}
            <div className="mr-auto text-sm text-base-content/70">
              {selectedMedia.length > 0
                ? `${selectedMedia.length} selected`
                : 'No media selected'}
            </div>

            {/* Expand Button */}
            <button
              className="btn btn-sm btn-ghost gap-2"
              onClick={onExpand}
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </button>

            {/* Create Post Button */}
            <button
              className="btn btn-sm btn-primary"
              onClick={handleCreatePost}
              disabled={selectedMedia.length === 0}
            >
              Create Post
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
};
