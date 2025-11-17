import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { PostCard } from "~/components/PostCard";
import { usePostsByMediaIdQuery } from "~/lib/queries/posts";

type Post = typeof PostWithRelationsSchema.static;

type MediaPostsProps = {
  mediaId: string;
};

export const MediaPosts = ({ mediaId }: MediaPostsProps) => {
  const { data: posts, isLoading, error } = usePostsByMediaIdQuery(mediaId);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-destructive">Failed to load posts</div>;
  }

  if (!posts || posts.length === 0) {
    return <div className="text-muted-foreground">No posts found</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post as Post} />
      ))}
    </div>
  );
};

