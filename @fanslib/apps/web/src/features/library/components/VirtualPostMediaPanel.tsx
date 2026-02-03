import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import type { Media } from '@fanslib/server/schemas';
import type { VirtualPost } from '~/lib/virtual-posts';
import { CombinedMediaSelection } from './CombinedMediaSelection';
import { RecentPostsPanel } from '../../posts/components/RecentPostsPanel';
import { MediaFiltersProvider } from './MediaFilters/MediaFiltersContext';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { MediaFilters } from './MediaFilters/MediaFilters';
import { useCreatePostMutation } from '~/lib/queries/posts';
import type { MediaFilter } from '@fanslib/server/schemas';

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
  const [userFilters, setUserFilters] = useState<MediaFilter>([]);
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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
            width: '80rem',
            maxWidth: '95vw',
            height: '90vh',
            maxHeight: '90vh',
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
            width: '80rem',
            height: '90vh',
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
            className="flex flex-col gap-3 p-4 border-b border-base-300"
            initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Date/Time */}
                <div className="flex flex-col">
                  <div className="text-lg font-semibold">
                    {format(new Date(virtualPost.date), 'EEEE, MMMM d')}
                  </div>
                  <div className="text-sm text-base-content/70">
                    {format(new Date(virtualPost.date), 'h:mm a')}
                  </div>
                </div>

                {/* Schedule Badge */}
                {virtualPost.schedule && (
                  <div
                    className="badge badge-sm"
                    style={{
                      backgroundColor: virtualPost.schedule.color ?? '#6366f1',
                      color: '#ffffff',
                    }}
                  >
                    {virtualPost.schedule.name}
                  </div>
                )}

                {/* Channel Badge */}
                <div className="badge badge-outline badge-sm">
                  {virtualPost.channel.name}
                </div>
              </div>

              {/* Close Button */}
              <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Filters */}
            <FilterPresetProvider onFiltersChange={setUserFilters}>
              <MediaFiltersProvider value={userFilters} onChange={setUserFilters}>
                <MediaFilters collapsed={true} />
              </MediaFiltersProvider>
            </FilterPresetProvider>
          </motion.div>

          {/* Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            {/* Recent Posts Context */}
            <div className="p-4 border-b border-base-300">
              <RecentPostsPanel
                channelId={virtualPost.channelId}
                limit={3}
                defaultCollapsed={true}
              />
            </div>

            {/* Media Selection Grid */}
            <div className="p-4">
              <CombinedMediaSelection
                selectedMedia={selectedMedia}
                onMediaSelect={handleMediaSelect}
                scheduleId={virtualPost.scheduleId ?? undefined}
                channelId={virtualPost.channelId}
                autoApplyFilters={true}
                applyRepostCooldown={true}
                pageLimit={24}
              />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="flex items-center justify-end gap-3 p-4 border-t border-base-300 bg-base-200"
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
