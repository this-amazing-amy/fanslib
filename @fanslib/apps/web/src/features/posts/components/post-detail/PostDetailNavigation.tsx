import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Copy, MoreVertical, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { DeleteConfirmDialog } from '~/components/ui/DeleteConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { CreatePostDialog } from '~/features/library/components/CreatePostDialog';
import { useDeletePostMutation, usePostsQuery } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailNavigationProps = {
  post: Post;
};

export const PostDetailNavigation = ({ post }: PostDetailNavigationProps) => {
  const navigate = useNavigate();
  const { data: allPosts } = usePostsQuery();
  const deletePostMutation = useDeletePostMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

  const adjacentPosts = useMemo(() => {
    if (!allPosts) {
      return { previous: null, next: null };
    }

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

  const handleDelete = async () => {
    await deletePostMutation.mutateAsync({ id: post.id });
    navigate({ to: '/plan' });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {(hasPrevious || hasNext) && (
          <>
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
          </>
        )}
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <DropdownMenuPopover placement="bottom end">
            <DropdownMenu>
              <DropdownMenuItem
                onAction={() => setIsDuplicateDialogOpen(true)}
                className="flex items-center whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-2 shrink-0" />
                Duplicate post
              </DropdownMenuItem>
              <DropdownMenuItem
                onAction={() => setIsDeleteDialogOpen(true)}
                className="text-error flex items-center whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuPopover>
        </DropdownMenuTrigger>
      </div>
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deletePostMutation.isPending}
      />
      <CreatePostDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        media={post.postMedia.map((pm) => pm.media)}
        initialDate={new Date()}
        initialChannelId={post.channelId}
        initialCaption={post.caption ?? undefined}
        initialStatus={post.status}
        initialSubredditId={post.subredditId ?? undefined}
        scheduleId={post.scheduleId ?? undefined}
        title="Duplicate Post"
      />
    </>
  );
};


