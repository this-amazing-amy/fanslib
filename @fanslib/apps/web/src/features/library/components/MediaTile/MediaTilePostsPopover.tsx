import type { Media } from '@fanslib/server/schemas';
import { Button } from 'react-aria-components';
import { formatDistanceToNow } from 'date-fns';
import { useMediaPostingHistoryQuery } from '~/lib/queries/library';
import { Popover, PopoverTrigger } from '~/components/ui/Popover/Popover';
import { ChannelBadge } from '~/components/ChannelBadge';
import { StatusBadge } from '~/components/StatusBadge';

type PostsPopoverProps = {
  media: Media;
};

export const MediaTilePostsPopover = ({ media }: PostsPopoverProps) => {
  const { data, isLoading } = useMediaPostingHistoryQuery(media.id);

  if (isLoading || !data || data.totalPosts === 0) {
    return null;
  }

  return (
    <PopoverTrigger>
      <Button className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md bg-base-100/90 hover:bg-base-100 border border-base-content/20 transition-colors">
        Posted {data.totalPosts}x
      </Button>
      <Popover className="max-w-md">
        <div className="space-y-3">
          <h3 className="font-semibold text-base">Posting History</h3>
          <div className="text-sm text-base-content/70">
            Posted {data.totalPosts} {data.totalPosts === 1 ? 'time' : 'times'}
            {data.lastPostedAt && (
              <>
                , last {formatDistanceToNow(new Date(data.lastPostedAt), { addSuffix: true })}
              </>
            )}
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.postsByChannel.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChannelBadge
                      name={post.channel.name}
                      typeId={post.channel.typeId}
                      size="sm"
                    />
                    <StatusBadge status={post.status} size="sm" showIcon />
                  </div>
                  
                  {post.caption && (
                    <p className="text-sm text-base-content/80 line-clamp-2">
                      {post.caption}
                    </p>
                  )}
                  
                  <div className="text-xs text-base-content/60">
                    {post.status === 'posted'
                      ? `Posted ${formatDistanceToNow(new Date(post.date), { addSuffix: true })}`
                      : `Scheduled for ${new Date(post.date).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {data.postsByChannel.length === 0 && (
            <div className="text-center py-4 text-base-content/60 text-sm">
              No posts found
            </div>
          )}
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
