import type { PostWithRelations } from '@fanslib/server/schemas';

type Post = PostWithRelations;

export type PostTypeFilter = "both" | "virtual" | "actual";

export type VirtualPost = Post & {
  isVirtual: true;
};

export const isVirtualPost = (post: Post | VirtualPost): post is VirtualPost =>
  post !== null && typeof post === "object" && "isVirtual" in post && post.isVirtual === true;

export const filterPostsByType = <T extends Post | VirtualPost>(posts: T[], filter: PostTypeFilter): T[] => {
  if (filter === "virtual") return posts.filter(isVirtualPost) as T[];
  if (filter === "actual") return posts.filter((post) => !isVirtualPost(post)) as T[];
  return posts;
};
