import type { PostWithRelations } from "@fanslib/server/schemas";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";
import { useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { useDebounce } from "~/hooks/useDebounce";
import { useUpdatePostMutation } from "~/lib/queries/posts";

type PostDetailTitleInputProps = {
  post: PostWithRelations;
};

export const PostDetailTitleInput = ({ post }: PostDetailTitleInputProps) => {
  const [localTitle, setLocalTitle] = useState(post.title ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { isCopied, copy } = useCopyToClipboard();
  const updatePostMutation = useUpdatePostMutation();

  useEffect(() => {
    setLocalTitle(post.title ?? "");
  }, [post.id, post.title]);

  const saveTitle = async (title: string) => {
    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        updates: {
          title: title.trim() || null,
        },
      });
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveTitle = useDebounce(saveTitle, 1000);

  const updateTitle = (newTitle: string) => {
    setLocalTitle(newTitle);
    debouncedSaveTitle(newTitle);
  };

  const copyCurrentTitle = () => {
    copy(localTitle);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="post-title" className="text-sm font-medium">
          Title
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCurrentTitle}
          isDisabled={!localTitle.trim()}
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
        <input
          id="post-title"
          type="text"
          placeholder="Add a title..."
          value={localTitle}
          onChange={(e) => updateTitle(e.target.value)}
          className="input input-bordered w-full"
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-base-100 p-1 rounded text-xs">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};
