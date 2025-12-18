import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import {
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  checkBridgeHealth,
  copyToClipboard,
  revealInFinder,
} from '../../lib/bridge';
import {
  buildLocalPath,
  escapeHtml,
  getMediaThumbnailUrl,
  getPostStatusBorderColor,
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
  onMarkPosted: () => void;
};

export const PostCard = ({
  post,
  libraryPath,
  apiUrl,
  webUrl,
  onMarkPosted,
}: PostCardProps) => {
  const media = post.postMedia || [];
  const hasLibraryPath = !!libraryPath;
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoadStates, setImageLoadStates] = useState<
    Map<number, 'loading' | 'loaded' | 'error'>
  >(new Map());
  const [showDebug, setShowDebug] = useState(false);
  const [bridgeAvailable, setBridgeAvailable] = useState<boolean | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>(
    'idle'
  );
  const [captionCopyState, setCaptionCopyState] = useState<'idle' | 'copied'>(
    'idle'
  );
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (hasLibraryPath) {
      checkBridgeHealth()
        .then((available) => {
          setBridgeAvailable(available);
        })
        .catch(() => {
          setBridgeAvailable(false);
        });
    } else {
      setBridgeAvailable(null);
    }
  }, [hasLibraryPath]);

  const toggleMediaSelection = (idx: number) => {
    setSelectedMedia((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleCopySelected = async () => {
    if (!hasLibraryPath || bridgeAvailable !== true) return;

    const indicesToCopy =
      selectedMedia.size > 0
        ? Array.from(selectedMedia)
        : media.map((_, idx) => idx);

    const filePaths = indicesToCopy.map((idx) =>
      buildLocalPath(libraryPath, media[idx].media.relativePath)
    );

    setCopyState('copying');

    try {
      await copyToClipboard(filePaths);
      setCopyState('copied');

      setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    } catch {
      setCopyState('idle');
    }
  };

  const handleRevealInFinder = async () => {
    if (!hasLibraryPath || bridgeAvailable !== true || media.length === 0)
      return;

    const firstMedia = media[0];
    const filePath = buildLocalPath(libraryPath, firstMedia.media.relativePath);

    try {
      await revealInFinder(filePath);
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

  const status = post.status ?? 'ready';
  const borderColor = getPostStatusBorderColor(
    status as 'posted' | 'scheduled' | 'ready' | 'draft'
  );

  return (
    <div
      className='rounded-xl p-4 border-2 bg-base-100'
      style={{ borderColor }}
    >
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
            className='absolute top-0 right-0 p-1 rounded-md bg-base-200/80 hover:bg-base-300 transition-colors opacity-0 group-hover:opacity-100'
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
          const isSelected = selectedMedia.has(idx);
          const canSelect = hasLibraryPath && bridgeAvailable === true;

          if (isVideoFile || hasError) {
            return (
              <div
                key={post.id}
                onClick={() => canSelect && toggleMediaSelection(idx)}
                className={`w-16 h-16 bg-base-100 rounded-lg flex items-center justify-center border-2 transition-colors relative ${
                  canSelect
                    ? 'cursor-pointer hover:bg-base-200'
                    : 'cursor-default opacity-60'
                } ${isSelected ? 'border-primary bg-primary/10' : 'border-base-300'}`}
                title={
                  hasError
                    ? `Failed to load thumbnail\nURL: ${thumbnailUrl}\nMedia ID: ${m.media.id}`
                    : isVideoFile
                      ? 'Click to select video'
                      : bridgeAvailable === false
                        ? 'FansLib Bridge not running'
                        : 'Click to select'
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
                {isSelected && (
                  <div className='absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center'>
                    <Check className='w-2.5 h-2.5 text-primary-content' />
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={thumbnailUrl}
              className='relative'
              onClick={() => canSelect && toggleMediaSelection(idx)}
            >
              <img
                src={thumbnailUrl}
                onError={() => handleImageError(idx)}
                onLoad={() => handleImageLoad(idx)}
                onLoadStart={() => handleImageLoadStart(idx)}
                className={`w-16 h-16 object-cover rounded-lg border-2 transition-all ${
                  canSelect
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-default opacity-60'
                } ${isSelected ? 'border-primary' : 'border-base-300'}`}
                alt={`Media ${idx + 1}`}
                title={
                  !hasLibraryPath
                    ? `Configure library path in settings\nURL: ${thumbnailUrl}`
                    : bridgeAvailable === false
                      ? 'FansLib Bridge not running'
                      : `Click to select\nURL: ${thumbnailUrl}`
                }
              />
              {loadState === 'loading' && (
                <div className='absolute inset-0 flex items-center justify-center bg-base-100/50 rounded-lg'>
                  <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                </div>
              )}
              {isSelected && (
                <div className='absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center'>
                  <Check className='w-2.5 h-2.5 text-primary-content' />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className='flex justify-between items-center gap-2'>
        <div className='flex items-center gap-2'>
          {hasLibraryPath && bridgeAvailable === true && (
            <>
              <button
                onClick={handleCopySelected}
                disabled={copyState === 'copying'}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 border cursor-pointer ${
                  copyState === 'copied'
                    ? 'bg-success/20 border-success text-success'
                    : 'bg-base-200 border-base-300 text-base-content hover:bg-base-300'
                }`}
                title={
                  selectedMedia.size > 0
                    ? `Copy ${selectedMedia.size} selected file(s)`
                    : `Copy all ${media.length} file(s)`
                }
              >
                {copyState === 'copying' ? (
                  <div className='w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin' />
                ) : copyState === 'copied' ? (
                  <Check className='w-3 h-3' />
                ) : (
                  <Copy className='w-3 h-3' />
                )}
                {copyState === 'copied'
                  ? 'Copied!'
                  : selectedMedia.size > 0
                    ? `Copy (${selectedMedia.size})`
                    : 'Copy All'}
              </button>
              {selectedMedia.size > 0 && (
                <button
                  onClick={() => setSelectedMedia(new Set())}
                  className='px-2 py-1.5 text-xs rounded-lg bg-base-200 border border-base-300 text-base-content/60 hover:bg-base-300 cursor-pointer'
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleRevealInFinder}
                className='px-2 py-1.5 text-xs rounded-lg bg-base-200 border border-base-300 text-base-content hover:bg-base-300 cursor-pointer flex items-center gap-1'
                title='Open folder in Finder to drag files'
              >
                <FolderOpen className='w-3 h-3' />
                Reveal
              </button>
            </>
          )}
          {hasLibraryPath && bridgeAvailable === false && (
            <span className='text-xs text-warning'>Bridge not running</span>
          )}
        </div>
        <button
          onClick={onMarkPosted}
          className='px-3 py-1.5 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 border hover:opacity-80 cursor-pointer'
          style={getPostStatusStyles('posted')}
        >
          <Check className='w-3 h-3' />
          Mark Posted
        </button>
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
