import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { useState } from 'react';
import { Input } from '~/components/ui/Input';
import { useDebounce } from '~/hooks/useDebounce';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailUrlInputProps = {
  post: Post;
};

export const PostDetailUrlInput = ({ post }: PostDetailUrlInputProps) => {
  const [localUrl, setLocalUrl] = useState(post.url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const updatePostMutation = useUpdatePostMutation();

  const saveUrl = async (url: string) => {
    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          url: url.trim() || null,
        },
      });
    } catch (error) {
      console.error('Failed to update URL:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveUrl = useDebounce(saveUrl, 1000);

  const updateUrl = (newUrl: string) => {
    setLocalUrl(newUrl);
    debouncedSaveUrl(newUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="post-url" className="text-sm font-medium">
        Post URL
      </label>
      <div className="relative">
        <Input
          id="post-url"
          type="url"
          placeholder="Enter post URL"
          value={localUrl}
          onChange={(e) => updateUrl(e.target.value)}
          isDisabled={isSaving}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="text-xs">Updating...</div>
          </div>
        )}
      </div>
    </div>
  );
};

