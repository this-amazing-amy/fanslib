import type { PostWithRelations } from '@fanslib/server/schemas';
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { VirtualPost } from "~/lib/virtual-posts";

type Post = PostWithRelations;

type UsePostTimelineVirtualizerArgs = {
  posts: (Post | VirtualPost)[];
};

export const usePostTimelineVirtualizer = ({
  posts,
}: UsePostTimelineVirtualizerArgs) => {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 148,
    overscan: 6,
    measureElement: (element) =>
      element?.getBoundingClientRect().height ?? 0,
  });

  return {
    scrollElementRef,
    virtualizer,
  };
};


