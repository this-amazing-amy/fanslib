import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { DeleteConfirmDialog } from '~/components/ui/DeleteConfirmDialog';
import { useDeletePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailDeleteButtonProps = {
  post: Post;
};

export const PostDetailDeleteButton = ({ post }: PostDetailDeleteButtonProps) => {
  const navigate = useNavigate();
  const deletePostMutation = useDeletePostMutation();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync({ id: post.id });
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: '/plan' });
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  return (
    <DeleteConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Delete Post"
      description="Are you sure you want to delete this post? This action cannot be undone. This will permanently delete the post and remove it from all associated media."
      onConfirm={handleDelete}
      isLoading={deletePostMutation.isPending}
    >
      <Button variant="ghost" className="hover:btn-error">
        <Trash2 className="size-4 mr-2" />
        Delete Post
      </Button>
    </DeleteConfirmDialog>
  );
};


