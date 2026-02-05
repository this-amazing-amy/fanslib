import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChannelBadge } from '~/components/ChannelBadge';
import { ContentScheduleBadge } from '~/components/ContentScheduleBadge';
import { MediaFilters } from '~/features/library/components/MediaFilters/MediaFilters';
import { useMediaFilters } from '~/features/library/components/MediaFilters/MediaFiltersContext';
import { cn } from '~/lib/cn';
import { getMediaThumbnailUrl } from '~/lib/media-urls';
import { useMediaListQuery } from '~/lib/queries/library';
import { useCreatePostMutation } from '~/lib/queries/posts';
import type { VirtualPost } from '~/lib/virtual-posts';

type VirtualPostInlinePickerProps = {
  virtualPost: VirtualPost | null;
  isOpen: boolean;
  onClose: () => void;
};

export const VirtualPostInlinePicker = ({
  virtualPost,
  isOpen,
  onClose,
}: VirtualPostInlinePickerProps) => {
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePostMutation();
  
  // Consume filters from parent MediaFiltersProvider
  const { filters } = useMediaFilters();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fetch 8 media candidates
  const { data: mediaResponse, isLoading } = useMediaListQuery({
    limit: 8,
    page: 1,
    sort: { field: 'fileModificationDate', direction: 'DESC' },
    filters,
    scheduleId: virtualPost?.scheduleId ?? undefined,
    channelId: virtualPost?.channelId ?? '',
    autoApplyFilters: true,
  });

  const candidates = mediaResponse?.items ?? [];

  const handleMediaClick = useCallback(async (mediaId: string) => {
    if (!virtualPost) return;
    try {
      await createPost({
        date: virtualPost.date,
        channelId: virtualPost.channelId,
        status: 'draft',
        caption: null,
        mediaIds: [mediaId],
        scheduleId: virtualPost.scheduleId ?? undefined,
        subredditId: undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }, [virtualPost, createPost, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !virtualPost) return null;

  const bottomSheet = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-base-100 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: prefersReducedMotion ? 0 : undefined 
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="@container flex items-center justify-between px-4 pb-3 border-b border-base-200">
              <div className="flex items-center gap-2 flex-wrap">
                <ChannelBadge
                  name={virtualPost.channel.name}
                  typeId={virtualPost.channel.typeId}
                  size="sm"
                />
                {virtualPost.schedule && (
                  <ContentScheduleBadge
                    name={virtualPost.schedule.name}
                    emoji={virtualPost.schedule.emoji}
                    color={virtualPost.schedule.color}
                    size="sm"
                  />
                )}
                <span className="text-base font-semibold text-base-content">
                  {format(new Date(virtualPost.date), 'EEE, MMM d')}
                </span>
                <span className="text-sm text-base-content/60">
                  {format(new Date(virtualPost.date), 'HH:mm')}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar */}
            <div className="px-4 py-3 border-b border-base-200">
              <MediaFilters />
            </div>

            {/* Media grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-base-content/50" />
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center h-32 text-sm text-base-content/50">
                    No media found
                  </div>
                ) : (
                  candidates.map((media) => (
                    <button
                      key={media.id}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden",
                        "hover:ring-2 hover:ring-primary hover:scale-105 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary",
                        isCreating && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => handleMediaClick(media.id)}
                      disabled={isCreating}
                    >
                      <img
                        src={getMediaThumbnailUrl(media.id)}
                        alt={media.name}
                        className="w-full h-full object-cover"
                      />
                      {media.type === 'video' && media.duration && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[10px] text-white">
                          {formatDuration(media.duration)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(bottomSheet, document.body);
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
