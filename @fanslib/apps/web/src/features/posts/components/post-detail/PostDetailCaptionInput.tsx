import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { HashtagButton } from '~/components/HashtagButton';
import { SnippetSelector } from '~/components/SnippetSelector';
import { Button } from '~/components/ui/Button';
import { Textarea } from '~/components/ui/Textarea';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { useDebounce } from '~/hooks/useDebounce';
import { useUpdatePostMutation } from '~/lib/queries/posts';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailCaptionInputProps = {
  post: Post;
};

export const PostDetailCaptionInput = ({ post }: PostDetailCaptionInputProps) => {
  const [localCaption, setLocalCaption] = useState(post.caption || '');
  const [isSaving, setIsSaving] = useState(false);
  const { isCopied, copy } = useCopyToClipboard();
  const updatePostMutation = useUpdatePostMutation();

  const saveCaption = async (caption: string) => {
    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          caption: caption.trim() || null,
        },
      });
    } catch (error) {
      console.error('Failed to update caption:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveCaption = useDebounce(saveCaption, 1000);

  const updateCaption = (newCaption: string) => {
    setLocalCaption(newCaption);
    debouncedSaveCaption(newCaption);
  };

  const copyCurrentCaption = () => {
    copy(localCaption);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="post-caption" className="text-sm font-medium">
          Caption
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCurrentCaption}
          isDisabled={!localCaption.trim()}
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <Textarea
          id="post-caption"
          placeholder="Add a caption..."
          value={localCaption}
          onChange={updateCaption}
          rows={10}
          className="pr-10"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <SnippetSelector
            channelId={post.channel?.id}
            caption={localCaption}
            onCaptionChange={updateCaption}
            className="text-base-content/60 hover:text-base-content"
          />
          <HashtagButton
            channel={post.channel}
            caption={localCaption}
            onCaptionChange={updateCaption}
            className="text-base-content/60 hover:text-base-content"
          />
        </div>
        {isSaving && (
          <div className="absolute right-2 bottom-2 bg-base-100 p-1 rounded text-xs">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};

