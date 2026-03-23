import { format } from "date-fns";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import type { VirtualPost } from "~/lib/virtual-posts";

type VirtualPostHeaderProps = {
  virtualPost: VirtualPost;
};

export const VirtualPostHeader = ({ virtualPost }: VirtualPostHeaderProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-lg">
          {format(new Date(virtualPost.date), "EEEE, MMMM d")}
        </h2>
        <div className="text-sm text-base-content/60 font-medium">
          {format(new Date(virtualPost.date), "h:mm a")}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <ChannelBadge
        name={virtualPost.channel.name}
        typeId={virtualPost.channel.type?.id ?? virtualPost.channel.typeId}
        size="sm"
        borderStyle="visible"
      />
      {virtualPost.schedule && (
        <ContentScheduleBadge
          name={virtualPost.schedule.name}
          emoji={virtualPost.schedule.emoji ?? undefined}
          color={virtualPost.schedule.color ?? undefined}
          size="sm"
          borderStyle="visible"
        />
      )}
    </div>
  </div>
);
