import type { Post } from "@fanslib/types";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { ChannelBadge } from "./ChannelBadge";
import { StatusSticker } from "./StatusSticker";
import { PostTagStickers } from "./PostTagStickers";
import { MediaTile } from "~/features/library/components/MediaTile";

type PostCardProps = {
  post: Post;
};

export const PostCard = ({ post }: PostCardProps) => {
  return (
    <Link
      to="/posts/$postId"
      params={{ postId: post.id }}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="border rounded-md relative group transition-colors hover:bg-accent/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ChannelBadge name={post.channel.name} typeId={post.channel.typeId} />
              <StatusSticker status={post.status} />
              <PostTagStickers postMedia={post.postMedia} />
            </div>
            <span className="text-sm text-muted-foreground block">
              {format(new Date(post.date), "MMMM d, h:mm aaa")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {post.postMedia.map((pm) => (
              <MediaTile
                key={pm.id}
                media={pm.media}
                allMedias={post.postMedia.map((pm) => pm.media)}
                index={post.postMedia.indexOf(pm)}
                className="size-24"
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

