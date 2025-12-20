import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkBridgeHealth, revealInFinder } from '../../lib/bridge';
import {
  buildLocalPath,
  escapeHtml,
  getMediaThumbnailUrl,
  getPostStatusStyles,
  getScheduleBadgeColors,
  isVideo,
} from '../../lib/utils';

type Post = typeof PostWithRelationsSchema.static;

type PostCardProps = {
  post: Post;
  libraryPath: string;
  apiUrl: string;
  webUrl: string;
  bridgeUrl: string;
  onMarkPosted: () => void;
  onMarkScheduled: () => void;
};

export const PostCard = ({
  post,
  libraryPath,
  apiUrl,
  webUrl,
  bridgeUrl,
  onMarkPosted,
  onMarkScheduled,
}: PostCardProps) => {
  const media = post.postMedia ?? [];
  const hasLibraryPath = !!libraryPath;
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoadStates, setImageLoadStates] = useState<
    Map<number, 'loading' | 'loaded' | 'error'>
  >(new Map());
  const [showDebug, setShowDebug] = useState(false);
  const [bridgeAvailable, setBridgeAvailable] = useState<boolean | null>(null);
  const [captionCopyState, setCaptionCopyState] = useState<'idle' | 'copied'>(
    'idle'
  );

  useEffect(() => {
    if (hasLibraryPath) {
      checkBridgeHealth(bridgeUrl)
        .then((available) => {
          setBridgeAvailable(available);
        })
        .catch(() => {
          setBridgeAvailable(false);
        });
    } else {
      setBridgeAvailable(null);
    }
  }, [hasLibraryPath, bridgeUrl]);

  const handleRevealInFinder = async (relativePath: string) => {
    if (!hasLibraryPath || bridgeAvailable !== true) return;

    const filePath = buildLocalPath(libraryPath, relativePath);

    try {
      await revealInFinder(bridgeUrl, filePath);
    } catch {
      // Silently ignore reveal errors
    }
  };

  const handleCopyCaption = async () => {
    if (!post.caption) return;

    try {
      // Remove HTML tags and decode HTML entities for plain text copy
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = post.caption;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';

      await navigator.clipboard.writeText(plainText);
      setCaptionCopyState('copied');

      setTimeout(() => {
        setCaptionCopyState('idle');
      }, 2000);
    } catch {
      // Silently ignore copy errors
    }
  };

  const handleImageError = (idx: number) => {
    setImageErrors((prev) => new Set(prev).add(idx));
    setImageLoadStates((prev) => {
      const next = new Map(prev);
      next.set(idx, 'error');
      return next;
    });
  };

  const handleImageLoad = (idx: number) => {
    setImageLoadStates((prev) => {
      const next = new Map(prev);
      next.set(idx, 'loaded');
      return next;
    });
  };

  const handleImageLoadStart = (idx: number) => {
    setImageLoadStates((prev) => {
      const next = new Map(prev);
      next.set(idx, 'loading');
      return next;
    });
  };

  return (
    <div className='rounded-xl p-3 bg-base-100'>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex flex-col'>
          <span className='text-base font-semibold text-base-content'>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className='text-sm font-medium text-base-content/60'>
            {new Date(post.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {post.schedule && (
            <div
              className='rounded-full font-medium flex items-center border text-xs px-2 py-0.5 gap-1.5'
              style={getScheduleBadgeColors(post.schedule.color)}
            >
              {post.schedule.emoji && <span>{post.schedule.emoji}</span>}
              <span>{post.schedule.name}</span>
            </div>
          )}
          <a
            href={`${webUrl.replace(/\/$/, '')}/posts/${post.id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='p-1.5 rounded-lg hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors cursor-pointer'
            title='Open in FansLib web app'
          >
            <ExternalLink className='w-3.5 h-3.5' />
          </a>
        </div>
      </div>

      {post.caption && (
        <div className='mb-3 relative group'>
          <div
            className='text-sm line-clamp-3 text-base-content/80 pr-8'
            dangerouslySetInnerHTML={{ __html: escapeHtml(post.caption) }}
          />
          <button
            onClick={handleCopyCaption}
            className='absolute top-0 right-0 p-1 rounded-md bg-base-200/80 hover:bg-base-300 transition-colors'
            title='Copy caption text'
          >
            {captionCopyState === 'copied' ? (
              <Check className='w-3.5 h-3.5 text-success' />
            ) : (
              <Copy className='w-3.5 h-3.5 text-base-content/60' />
            )}
          </button>
        </div>
      )}

      <div className='flex flex-wrap gap-2 mb-3'>
        {media.map((m: (typeof post.postMedia)[number], idx: number) => {
          const hasError = imageErrors.has(idx);
          const isVideoFile = isVideo(m.media.relativePath);
          const loadState = imageLoadStates.get(idx);
          const thumbnailUrl = getMediaThumbnailUrl(apiUrl, m.media.id);

          const canReveal = hasLibraryPath && bridgeAvailable === true;

          if (isVideoFile || hasError) {
            return (
              <div
                key={post.id}
                onClick={() =>
                  canReveal && handleRevealInFinder(m.media.relativePath)
                }
                className={`w-16 h-16 bg-base-100 rounded-lg flex items-center justify-center border-2 border-base-300 relative ${canReveal ? 'cursor-pointer hover:bg-base-200' : ''}`}
                title={
                  hasError
                    ? `Failed to load thumbnail\nURL: ${thumbnailUrl}\nMedia ID: ${m.media.id}`
                    : canReveal
                      ? 'Click to reveal in folder'
                      : 'Video file'
                }
              >
                {isVideoFile ? (
                  <Video className='w-6 h-6 text-base-content/60' />
                ) : (
                  <>
                    <ImageIcon className='w-6 h-6 text-base-content/60' />
                    {hasError && (
                      <div className='absolute inset-0 flex items-center justify-center bg-error/10 rounded-lg'>
                        <span className='text-[8px] text-error font-bold'>
                          !
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }

          return (
            <div
              key={thumbnailUrl}
              className='relative'
              onClick={() =>
                canReveal && handleRevealInFinder(m.media.relativePath)
              }
            >
              <img
                src={thumbnailUrl}
                onError={() => handleImageError(idx)}
                onLoad={() => handleImageLoad(idx)}
                onLoadStart={() => handleImageLoadStart(idx)}
                className={`w-16 h-16 object-cover rounded-lg border-2 border-base-300 ${canReveal ? 'cursor-pointer hover:opacity-80' : ''}`}
                alt={`Media ${idx + 1}`}
                title={canReveal ? 'Click to reveal in folder' : thumbnailUrl}
              />
              {loadState === 'loading' && (
                <div className='absolute inset-0 flex items-center justify-center bg-base-100/50 rounded-lg'>
                  <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className='flex justify-between items-center gap-2'>
        <div className='flex items-center gap-2'>
          {hasLibraryPath && bridgeAvailable === false && (
            <span className='text-xs text-warning'>Bridge not running</span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={onMarkScheduled}
            className='px-3 py-1.5 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 border hover:opacity-80 cursor-pointer'
            style={getPostStatusStyles('scheduled')}
          >
            <Calendar className='w-3 h-3' />
            Mark Scheduled
          </button>
          <button
            onClick={onMarkPosted}
            className='px-3 py-1.5 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 border hover:opacity-80 cursor-pointer'
            style={getPostStatusStyles('posted')}
          >
            <Check className='w-3 h-3' />
            Mark Posted
          </button>
        </div>
      </div>

      {imageErrors.size > 0 && (
        <div className='mt-3 p-2 bg-error/10 border border-error/20 rounded text-xs'>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className='text-error font-medium mb-1'
          >
            {showDebug ? '▼' : '▶'} Debug: {imageErrors.size} thumbnail(s)
            failed to load
          </button>
          {showDebug && (
            <div className='mt-2 space-y-1 text-error/80'>
              <div>API URL: {apiUrl}</div>
              <div>Library Path: {libraryPath || 'Not configured'}</div>
              {Array.from(imageErrors).map((idx) => {
                const m = media[idx];
                const thumbnailUrl = getMediaThumbnailUrl(apiUrl, m.media.id);
                return (
                  <div key={idx} className='pl-2 border-l-2 border-error/30'>
                    <div>Media {idx + 1}:</div>
                    <div className='pl-2'>ID: {m.media.id}</div>
                    <div className='pl-2'>Path: {m.media.relativePath}</div>
                    <div className='pl-2 break-all'>
                      URL:{' '}
                      <a
                        href={thumbnailUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='underline'
                      >
                        {thumbnailUrl}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
