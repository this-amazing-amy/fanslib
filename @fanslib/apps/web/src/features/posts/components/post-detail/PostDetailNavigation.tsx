import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { Button } from '~/components/ui/Button';
import { usePostsQuery } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailNavigationProps = {
  post: Post;
};

export const PostDetailNavigation = ({ post }: PostDetailNavigationProps) => {
  const navigate = useNavigate();
  const { data: allPosts = [] } = usePostsQuery();

  const adjacentPosts = useMemo(() => {
    const channelPosts = allPosts
      .filter((p) => p.channelId === post.channelId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const currentIndex = channelPosts.findIndex((p) => p.id === post.id);

    if (currentIndex === -1) {
      return { previous: null, next: null };
    }

    return {
      previous: currentIndex > 0 ? channelPosts[currentIndex - 1] : null,
      next: currentIndex < channelPosts.length - 1 ? channelPosts[currentIndex + 1] : null,
    };
  }, [allPosts, post.id, post.channelId]);

  const navigateToPrevious = useCallback(() => {
    if (adjacentPosts.previous) {
      navigate({ to: '/posts/$postId', params: { postId: adjacentPosts.previous.id } });
    }
  }, [adjacentPosts.previous, navigate]);

  const navigateToNext = useCallback(() => {
    if (adjacentPosts.next) {
      navigate({ to: '/posts/$postId', params: { postId: adjacentPosts.next.id } });
    }
  }, [adjacentPosts.next, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputFocused) return;

      if ((event.key === 'ArrowLeft' || event.key === 'h') && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        navigateToPrevious();
      } else if (
        (event.key === 'ArrowRight' || event.key === 'l') &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        navigateToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPrevious, navigateToNext]);

  const hasPrevious = !!adjacentPosts.previous;
  const hasNext = !!adjacentPosts.next;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={navigateToPrevious}
        isDisabled={!hasPrevious}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={navigateToNext} isDisabled={!hasNext}>
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};


