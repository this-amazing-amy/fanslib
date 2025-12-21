import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { PostCard } from "~/components/PostCard";
import { usePostsByShootIdQuery } from "~/lib/queries/shoots";

type Post = typeof PostWithRelationsSchema.static;

type ShootPostsProps = {
  shootId: string;
};

export const ShootPosts = ({ shootId }: ShootPostsProps) => {
  const { data: posts, isLoading, error } = usePostsByShootIdQuery(shootId);

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

