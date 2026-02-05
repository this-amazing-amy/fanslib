import type { PostMediaWithMedia, PostWithRelations } from '@fanslib/server/schemas';
import { Link } from '@tanstack/react-router';
import { addDays, format, isSameDay } from 'date-fns';
import { Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ChannelTypeIcon } from '~/components/ChannelTypeIcon';
import { ToggleGroup } from '~/components/ui/ToggleGroup';
import type { ChannelTypeId } from '~/lib/channel-types';
import { useTemporalContextPostsQuery } from '~/lib/queries/posts';
import { PostCalendarPostMedia } from '../PostCalendar/PostCalendarPostMedia';
import { PostCalendarPostView } from '../PostCalendar/PostCalendarPostView';

type Post = PostWithRelations;

type ChannelFilter = 'same' | 'all';

type PostMediaDateCasted = PostMediaWithMedia & {
  createdAt: Date;
  updatedAt: Date;
  media: {
    createdAt: Date;
    updatedAt: Date;
    fileCreationDate: Date;
    fileModificationDate: Date;
  };
};

type PostDetailTemporalContextProps = {
  post: Post;
};

export const PostDetailTemporalContext = ({ post }: PostDetailTemporalContextProps) => {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('same');
  const centerDate = useMemo(() => new Date(post.date), [post.date]);
  const { data: posts, isLoading } = useTemporalContextPostsQuery(
    centerDate,
    channelFilter === 'same' ? post.channelId : undefined
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(centerDate, i - 3)),
    [centerDate]
  );

  const channelToggle = (
    <ToggleGroup
      value={channelFilter}
      aria-label="Channel filter"
      onChange={(value) => {
        if (value) setChannelFilter(value as ChannelFilter);
      }}
      options={[
        {
          value: 'same',
          icon: <ChannelTypeIcon typeId={post.channel.typeId as ChannelTypeId} className="h-4 w-4" color="oklch(0.45 0.1 270)" />,
          ariaLabel: 'Same channel',
        },
        {
          value: 'all',
          icon: <Layers className="h-4 w-4" />,
          ariaLabel: 'All channels',
        },
      ]}
      size="sm"
    />
  );

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Timeline</h2>
          {channelToggle}
        </div>
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => (
            <div key={day.toISOString()} className="animate-pulse bg-base-200 rounded-lg h-32" />
          ))}
        </div>
      </div>
    );
  }

  const normalizeStatus = (status: string): 'posted' | 'scheduled' | 'draft' =>
    status === 'posted' ? 'posted' : status === 'scheduled' ? 'scheduled' : 'draft';

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
        {channelToggle}
      </div>
      <div className="grid grid-cols-7 gap-4 max-h-[600px] overflow-y-auto py-2">
        {days.map((day) => {
          const isCurrentPostDay = isSameDay(day, centerDate);
          const dayPosts = (posts ?? [])
            .filter((p) => isSameDay(new Date(p.date), day))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col rounded-lg p-2 ${
                isCurrentPostDay ? 'bg-base-200' : ''
              }`}
            >
              {/* Day header */}
              <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                <span className={`font-medium text-sm ${isCurrentPostDay ? 'bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center' : 'w-6 h-6 flex items-center justify-center'}`}>
                  {format(day, 'd')}
                </span>
                <span className="text-xs text-base-content/60">{format(day, 'EEE')}</span>
              </div>

              {/* Posts for this day */}
              <div className="flex flex-col gap-2">
                {dayPosts.map((dayPost) => {
                  const isCurrentPost = dayPost.id === post.id;

                  return (
                    <PostCalendarPostView
                      key={dayPost.id}
                      date={new Date(dayPost.date)}
                      status={normalizeStatus(dayPost.status)}
                      channel={{
                        name: dayPost.channel.name,
                        typeId: dayPost.channel.typeId,
                      }}
                      schedule={
                        dayPost.schedule
                          ? {
                              name: dayPost.schedule.name,
                              emoji: dayPost.schedule.emoji ?? undefined,
                              color: dayPost.schedule.color ?? undefined,
                            }
                          : undefined
                      }
                      caption={dayPost.caption ?? undefined}
                      showCaption={false}
                      mediaSlot={
                        <PostCalendarPostMedia
                          postMedia={dayPost.postMedia as unknown as PostMediaDateCasted[]}
                          isVirtual={false}
                        />
                      }
                      wrapper={
                        isCurrentPost
                          ? (children: ReactNode) => (
                              <div className="ring-3 ring-primary rounded-xl [&>*]:border-0">{children}</div>
                            )
                          : (children: ReactNode) => (
                              <Link
                                to="/posts/$postId"
                                params={{ postId: dayPost.id }}
                                className="block hover:scale-[1.02] transition-transform"
                              >
                                {children}
                              </Link>
                            )
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
