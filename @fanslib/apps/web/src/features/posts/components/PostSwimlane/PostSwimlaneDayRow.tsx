import { format, isToday } from "date-fns";
import { cn } from "~/lib/cn";
import type { PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import type { VirtualPost } from "~/lib/virtual-posts";
import { PostSwimlaneCell } from "./PostSwimlaneCell";

type Post = PostWithRelations;
type Channel = { id: string; name: string; typeId: string };

type PostSwimlaneDayRowProps = {
  date: Date;
  channels: Channel[];
  postsByChannel: Map<string, (Post | VirtualPost)[]>;
};

export const PostSwimlaneDayRow = ({
  date,
  channels,
  postsByChannel,
}: PostSwimlaneDayRowProps) => {
  const isTodayDay = isToday(date);

  return (
    <div
      className="grid gap-2 py-2 border-b border-base-300/50"
      style={{
        gridTemplateColumns: `120px repeat(${channels.length}, minmax(140px, 1fr))`,
      }}
    >
      {/* Date cell - sticky left */}
      <div
        className={cn(
          "flex flex-col justify-center px-3 py-2 rounded-lg",
          isTodayDay && "bg-base-200 ring-2 ring-primary/50"
        )}
      >
        <div className="text-xs text-base-content/60">{format(date, "EEE")}</div>
        <time
          dateTime={format(date, "yyyy-MM-dd")}
          className={cn(
            "text-sm font-semibold",
            isTodayDay && "text-primary"
          )}
        >
          {format(date, "d MMM")}
        </time>
      </div>

      {/* Channel cells */}
      {channels.map((channel) => {
        const channelPosts = postsByChannel.get(channel.id) ?? [];
        return (
          <PostSwimlaneCell
            key={channel.id}
            date={date}
            channelId={channel.id}
            posts={channelPosts}
          />
        );
      })}
    </div>
  );
};

