import { eachDayOfInterval, isSameDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { useChannelsQuery } from "~/lib/queries/channels";
import { type VirtualPost } from "~/lib/virtual-posts";
import { PostTimeline } from "../PostTimeline";
import { CreatePostDialogProvider } from "./CreatePostDialogContext";
import { PostSwimlaneDayRow } from "./PostSwimlaneDayRow";
import { PostSwimlaneHeader } from "./PostSwimlaneHeader";

type Post = typeof PostWithRelationsSchema.static;

type PostSwimlaneProps = {
  posts: (Post | VirtualPost)[];
  className?: string;
  onUpdate: () => Promise<void>;
};

export const PostSwimlane = ({ posts, className, onUpdate }: PostSwimlaneProps) => {
  const { preferences } = usePostPreferences();
  const { data: channels = [] } = useChannelsQuery();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Fallback to timeline on mobile
  if (!isDesktop) {
    return <PostTimeline posts={posts} className={className} onUpdate={onUpdate} />;
  }

  const dateRange = preferences.filter.dateRange;
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return <PostTimeline posts={posts} className={className} onUpdate={onUpdate} />;
  }

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: new Date(dateRange.startDate),
        end: new Date(dateRange.endDate),
      }),
    [dateRange.startDate, dateRange.endDate]
  );

  // Group posts by day and channel
  // Get channel order and visibility preferences
  const channelOrder = useMemo(() => {
    const savedOrder = preferences.view.swimlane?.channelOrder;
    if (!savedOrder || savedOrder.length === 0) {
      return channels.map((c) => c.id);
    }
    // Merge saved order with any new channels (append new channels at end)
    const ordered = savedOrder.filter((id) => channels.some((c) => c.id === id));
    const newChannels = channels.filter((c) => !savedOrder.includes(c.id));
    return [...ordered, ...newChannels.map((c) => c.id)];
  }, [preferences.view.swimlane?.channelOrder, channels]);

  const hiddenChannels = useMemo(
    () => preferences.view.swimlane?.hiddenChannels ?? [],
    [preferences.view.swimlane?.hiddenChannels]
  );

  // Apply order and filter hidden channels
  const visibleChannels = useMemo(() => channelOrder
      .map((id) => channels.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined && !hiddenChannels.includes(c.id)), [channels, channelOrder, hiddenChannels]);

  const grid = useMemo(() => days.map((day) => {
      const postsByChannel = new Map<string, (Post | VirtualPost)[]>();

      posts
        .filter((post) => isSameDay(new Date(post.date), day))
        .forEach((post) => {
          const channelId = post.channelId;
          const existing = postsByChannel.get(channelId) ?? [];
          postsByChannel.set(channelId, [...existing, post]);
        });

      return {
        date: day,
        postsByChannel,
      };
    }), [days, posts]);

  if (channels.length === 0) {
    return <PostTimeline posts={posts} className={className} onUpdate={onUpdate} />;
  }

  if (visibleChannels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/60">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">All channels are hidden</p>
          <p className="text-sm">Use the dropdown in the header to restore hidden channels</p>
        </div>
      </div>
    );
  }

  return (
    <CreatePostDialogProvider onUpdate={onUpdate}>
      <div className={className}>
        <ScrollArea orientation="both" className="h-full">
          <div className="min-w-fit">
            <PostSwimlaneHeader channels={channels} />
            <div>
              {grid.map((day) => (
                <PostSwimlaneDayRow
                  key={day.date.toISOString()}
                  date={day.date}
                  channels={visibleChannels}
                  postsByChannel={day.postsByChannel}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </CreatePostDialogProvider>
  );
};

