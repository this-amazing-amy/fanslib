import { CHANNEL_TYPES } from '@fanslib/server/constants';
import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useEffect, useState } from 'react';
import { eden } from '../../lib/api';
import { getSettings, type Settings } from '../../lib/storage';
import { EmptyState } from './EmptyState';
import { PopupHeader } from './PopupHeader';
import { PostCard } from './PostCard';
import { PostNavigation } from './PostNavigation';

type Post = typeof PostWithRelationsSchema.static;

export const Popup = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      const api = eden(loadedSettings.apiUrl);

      // Fetch posts with status "ready" and channel type "fansly"
      const response = await api.api.posts.all.get({
        query: {
          filters: JSON.stringify({
            statuses: ['ready'],
            channelTypes: [CHANNEL_TYPES.fansly.id],
          }),
        },
      });

      if (response.error) {
        throw new Error('Failed to fetch posts');
      }

      // Sort by date ascending (oldest first)
      const sortedPosts = (response.data ?? []).sort(
        (a: Post, b: Post) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setPosts(sortedPosts);
      setCurrentIndex(0);
      setStatus('connected');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect');
      setPosts([]);
    }
  };

  const updatePostStatus = async (
    postId: string,
    newStatus: 'posted' | 'scheduled'
  ) => {
    if (!settings) return;

    try {
      const api = eden(settings.apiUrl);
      const response = await api.api.posts['by-id']({ id: postId }).patch({
        status: newStatus,
      });

      // Check for API errors (response may have error property)
      const responseWithError = response as { error?: unknown; data?: unknown };
      if (responseWithError.error) {
        const errorMessage =
          typeof responseWithError.error === 'string'
            ? responseWithError.error
            : 'Failed to update post';
        console.error('API error:', responseWithError.error);
        setErrorMessage(errorMessage);
        setStatus('error');
        throw new Error(errorMessage);
      }

      await loadPosts();
      setErrorMessage(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to mark post as ${newStatus}`;
      console.error(`Failed to mark post as ${newStatus}:`, err);
      setErrorMessage(errorMessage);
      setStatus('error');
    }
  };

  const markAsPosted = async (postId: string) => {
    await updatePostStatus(postId, 'posted');
  };

  const markAsScheduled = async (postId: string) => {
    await updatePostStatus(postId, 'scheduled');
  };

  const goToNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const currentPost = posts[currentIndex];

  return (
    <div className='w-[420px] min-h-[300px] max-h-[600px] bg-base-100 text-base-content overflow-y-auto flex flex-col rounded-lg pb-4'>
      <PopupHeader
        postCount={posts.length}
        currentIndex={currentIndex}
        connectionStatus={status}
        errorMessage={errorMessage}
        onOpenSettings={openSettings}
      />

      {posts.length === 0 ? (
        <EmptyState />
      ) : currentPost ? (
        <div className='px-3 pt-3'>
          <PostCard
            post={currentPost}
            libraryPath={settings?.libraryPath ?? ''}
            apiUrl={settings?.apiUrl ?? ''}
            webUrl={settings?.webUrl ?? ''}
            bridgeUrl={settings?.bridgeUrl ?? ''}
            onMarkPosted={() => markAsPosted(currentPost.id)}
            onMarkScheduled={() => markAsScheduled(currentPost.id)}
          />

          <PostNavigation
            currentIndex={currentIndex}
            totalPosts={posts.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        </div>
      ) : null}
    </div>
  );
};
