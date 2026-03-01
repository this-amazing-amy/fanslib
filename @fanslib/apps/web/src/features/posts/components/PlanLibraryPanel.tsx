import type { Media, MediaFilter } from '@fanslib/server/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { LibraryPreferencesProvider, useLibraryPreferences } from '~/contexts/LibraryPreferencesContext';
import { usePostPreferences } from '~/contexts/PostPreferencesContext';
import { ClientOnly } from '~/components/ClientOnly';
import { CreatePostDialog } from '~/features/library/components/CreatePostDialog';
import { Gallery } from '~/features/library/components/Gallery/Gallery';
import { GalleryPagination } from '~/features/library/components/Gallery/GalleryPagination';
import { GallerySkeleton } from '~/features/library/components/Gallery/GallerySkeleton';
import { GalleryViewSettings } from '~/features/library/components/Gallery/GalleryViewSettings';
import { LibrarySortOptions } from '~/features/library/components/Gallery/LibrarySortOptions';
import { MediaFilters } from '~/features/library/components/MediaFilters/MediaFilters';
import { MediaFiltersProvider } from '~/features/library/components/MediaFilters/MediaFiltersContext';
import { useMediaListQuery } from '~/lib/queries/library';
import { QUERY_KEYS } from '~/lib/queries/query-keys';
import type { VirtualPost } from '~/lib/virtual-posts';
import { useInlinePicker, useInlinePickerActions } from '../contexts/InlinePickerContext';
import { useCreatePostFromVirtualSlot } from '../hooks/useCreatePostFromVirtualSlot';

type PlanLibraryPanelInnerProps = {
  virtualPost: VirtualPost | null;
  externalFilters: MediaFilter;
};

const PlanLibraryPanelInner = ({ virtualPost, externalFilters }: PlanLibraryPanelInnerProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const { preferences: postPreferences } = usePostPreferences();
  const { clearFloatingPost } = useInlinePickerActions();
  const { createPostFromVirtualSlot } = useCreatePostFromVirtualSlot();
  const [dialogMedia, setDialogMedia] = useState<Media | null>(null);
  const queryClient = useQueryClient();

  const invalidateCalendar = useCallback(() =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() }),
    ]).then(() => undefined),
    [queryClient]
  );

  const mediaClickHandler = useCallback(
    async (media: Media) => {
      if (!virtualPost) return;
      if (postPreferences.view.openDialogOnDrop) {
        setDialogMedia(media);
      } else {
        await createPostFromVirtualSlot({
          virtualPost,
          mediaIds: [media.id],
          onUpdate: invalidateCalendar,
        });
        clearFloatingPost();
      }
    },
    [virtualPost, postPreferences.view.openDialogOnDrop, createPostFromVirtualSlot, invalidateCalendar, clearFloatingPost]
  );

  // Sync external filters (from virtual post selection) with library preferences
  useEffect(() => {
    if (externalFilters.length > 0) {
      updatePreferences({
        filter: externalFilters,
        pagination: { page: 1 },
      });
    }
  }, [externalFilters, updatePreferences]);

  const {
    data: mediaList,
    error,
    isLoading,
    isFetching,
  } = useMediaListQuery({
    page: preferences.pagination.page,
    limit: preferences.pagination.limit,
    sort: preferences.sort,
    filters: preferences.filter,
  });

  const updateFilters = (filters: MediaFilter) => {
    updatePreferences({
      filter: filters,
      pagination: { page: 1 },
    });
  };

  const toggleFiltersCollapsed = () => {
    updatePreferences({
      view: {
        filtersCollapsed: !preferences.view.filtersCollapsed,
      },
    });
  };

  return (
    <FilterPresetProvider onFiltersChange={updateFilters}>
      <MediaFiltersProvider value={preferences.filter} onChange={updateFilters}>
        {virtualPost && (
          <CreatePostDialog
            open={dialogMedia !== null}
            onOpenChange={(open) => {
              if (!open) {
                setDialogMedia(null);
                clearFloatingPost();
              }
            }}
            media={dialogMedia ? [dialogMedia] : []}
            initialDate={virtualPost ? new Date(virtualPost.date) : undefined}
            initialChannelId={virtualPost?.channelId}
            scheduleId={virtualPost?.scheduleId ?? undefined}
            virtualPost={virtualPost}
          />
        )}
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-end gap-2 pt-2 mb-4">
                <LibrarySortOptions
                  value={preferences.sort}
                  onChange={(sort) => {
                    updatePreferences({
                      sort,
                      pagination: { page: 1 },
                    });
                  }}
                />
                <GalleryViewSettings />
              </div>
              <div className="mb-4">
                <MediaFilters
                  collapsed={preferences.view.filtersCollapsed}
                  onToggle={toggleFiltersCollapsed}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {isLoading || (isFetching && !mediaList) ? (
                <GallerySkeleton />
              ) : (
                <ClientOnly fallback={<GallerySkeleton />}>
                  <Gallery
                    medias={(mediaList?.items as Media[] | undefined) ?? []}
                    error={error ? (error instanceof Error ? error.message : 'Unknown error') : undefined}
                    onScan={() => {}}
                    onMediaClick={virtualPost ? mediaClickHandler : undefined}
                  />
                </ClientOnly>
              )}
            </div>
            <GalleryPagination totalPages={mediaList?.totalPages ?? 0} totalItems={mediaList?.total ?? 0} />
          </div>
        </div>
      </MediaFiltersProvider>
    </FilterPresetProvider>
  );
};

export const PlanLibraryPanel = () => {
  const { state } = useInlinePicker();

  return (
    <LibraryPreferencesProvider storageKey="planLibraryPreferences">
      <PlanLibraryPanelInner 
        virtualPost={state.virtualPost} 
        externalFilters={state.filters}
      />
    </LibraryPreferencesProvider>
  );
};
