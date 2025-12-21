import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { FileText } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "~/components/ui/EmptyState";
import { PostPreview } from "~/features/posts/components/PostPreview/PostPreview";
import { usePostsByShootIdQuery } from "~/lib/queries/shoots";

type Post = typeof PostWithRelationsSchema.static;

type ShootPostsProps = {
  shootId: string;
};

export const ShootPosts = ({ shootId }: ShootPostsProps) => {
  const { data: posts, isLoading, error, refetch } = usePostsByShootIdQuery(shootId);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const handleUpdate = async () => {
    await refetch();
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-destructive">Failed to load posts</div>;
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No posts found"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post, index) => (
        <PostPreview
          key={post.id}
          post={post as Post}
          onUpdate={handleUpdate}
          isOpen={openPostId === post.id}
          onOpenChange={(isOpen) => setOpenPostId(isOpen ? post.id : null)}
          previousPostInList={index > 0 ? (posts[index - 1] as Post) : undefined}
          nextPostInList={index < posts.length - 1 ? (posts[index + 1] as Post) : undefined}
        />
      ))}
    </div>
  );
};

