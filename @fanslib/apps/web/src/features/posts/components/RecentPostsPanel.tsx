import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRecentPostsQuery } from '~/lib/queries/posts';
import { StatusBadge } from '~/components/StatusBadge';
import { MediaTileLite } from '~/features/library/components/MediaTile/MediaTileLite';

type RecentPostsPanelProps = {
  channelId: string;
  limit?: number;
  defaultCollapsed?: boolean;
};

export const RecentPostsPanel = ({ 
  channelId, 
  limit = 3,
  defaultCollapsed = false,
}: RecentPostsPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { data: posts, isLoading } = useRecentPostsQuery({ channelId, limit });

  if (isLoading) {
    return (
      <div className="p-4 bg-base-200/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="loading loading-spinner loading-sm"></div>
          <span className="text-sm text-base-content/60">Loading recent posts...</span>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="p-4 bg-base-200/50 rounded-lg text-center text-sm text-base-content/60">
        No recent posts for this channel
      </div>
    );
  }

  return (
    <div className="bg-base-200/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-base-200 transition-colors"
      >
        <h3 className="font-semibold text-sm">Recent Posts ({posts.length})</h3>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {!isCollapsed && (
        <div className="space-y-2 p-3 pt-0">
          {posts.map((post) => {
            const hasPostMedia = 'postMedia' in post && post.postMedia && Array.isArray(post.postMedia) && post.postMedia.length > 0;
            
            return (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-base-100 hover:bg-base-100/80 transition-colors"
              >
                {hasPostMedia && Array.isArray(post.postMedia) ? (
                  <div className="flex gap-1">
                    {post.postMedia.slice(0, 3).map((pm) => 
                      pm.media ? (
                        <MediaTileLite
                          key={pm.media.id}
                          media={pm.media}
                          className="w-16 h-16"
                        />
                      ) : null
                    )}
                    {post.postMedia.length > 3 ? (
                      <div className="w-16 h-16 rounded-md bg-base-200 flex items-center justify-center text-xs font-semibold text-base-content/60">
                        +{post.postMedia.length - 3}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={post.status} size="sm" showIcon />
                    <span className="text-xs text-base-content/60">
                      {post.status === 'posted' || post.status === 'scheduled'
                        ? formatDistanceToNow(new Date(post.date), { addSuffix: true })
                        : 'Draft'}
                    </span>
                  </div>

                  {post.caption && (
                    <p className="text-sm text-base-content/80 line-clamp-2">
                      {post.caption.length > 50
                        ? `${post.caption.slice(0, 50)}...`
                        : post.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
