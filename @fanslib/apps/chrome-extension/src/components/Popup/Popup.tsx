import { CHANNEL_TYPES } from '@fanslib/server/constants';
import type { PostWithRelations } from '@fanslib/server/schemas';
import { useEffect, useState } from 'react';
import { eden } from '../../lib/api';
import { getSettings, type Settings } from '../../lib/storage';
import { CredentialsTab } from './CredentialsTab';
import { EmptyState } from './EmptyState';
import { PopupHeader } from './PopupHeader';
import { PostCard } from './PostCard';
import { PostNavigation } from './PostNavigation';
import { StatisticsTab } from './StatisticsTab';

type Post = PostWithRelations;
type Tab = 'queue' | 'statistics' | 'credentials';

export const Popup = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      const api = eden(loadedSettings.apiUrl);

      // Fetch posts with status "ready" and channel type "fansly"
      const response = await api.api.posts.all.$get({
        query: {
          filters: JSON.stringify({
            statuses: ['ready'],
            channelTypes: [CHANNEL_TYPES.fansly.id],
          }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const responseData = await response.json();
      const postsArray = Array.isArray(responseData)
        ? responseData
        : (responseData?.posts ?? []);

      // Filter out any null/undefined posts or posts with null dates
      const validPosts = postsArray.filter(
        (p): p is Post => p != null && p.date != null
      );

      const sortedPosts = validPosts.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setPosts(sortedPosts);
      setCurrentIndex(0);
      setStatus('connected');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect');
      setPosts([]);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const updatePostStatus = async (
    postId: string,
    newStatus: 'posted' | 'scheduled'
  ) => {
    if (!settings) return;

    try {
      const api = eden(settings.apiUrl);
      const response = await api.api.posts['by-id'][':id'].$patch({
        param: { id: postId },
        json: { status: newStatus },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        setErrorMessage('Failed to update post');
        setStatus('error');
        throw new Error('Failed to update post');
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
    <div className='w-full h-screen bg-base-100 text-base-content overflow-y-auto flex flex-col'>
      <PopupHeader
        postCount={posts.length}
        currentIndex={currentIndex}
        connectionStatus={status}
        errorMessage={errorMessage}
        onOpenSettings={openSettings}
        onRefresh={() => loadPosts(true)}
        isRefreshing={isRefreshing}
      />

      <div className='tabs tabs-boxed px-3 pt-3'>
        <button
          className={`tab ${activeTab === 'queue' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Post Queue
        </button>
        <button
          className={`tab ${activeTab === 'statistics' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <button
          className={`tab ${activeTab === 'credentials' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          Credentials
        </button>
      </div>

      {activeTab === 'queue' ? (
        posts.length === 0 ? (
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
        ) : null
      ) : activeTab === 'statistics' ? (
        <StatisticsTab />
      ) : (
        <CredentialsTab />
      )}
    </div>
  );
};
