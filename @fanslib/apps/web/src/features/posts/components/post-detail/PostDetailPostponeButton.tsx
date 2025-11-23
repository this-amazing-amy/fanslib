import type { PostWithRelationsSchema } from '@fanslib/server/schemas';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { useDraftBlueskyMutation } from '~/lib/queries/postpone';
import { useSettingsQuery } from '~/lib/queries/settings';

type Post = typeof PostWithRelationsSchema.static;

type PostDetailPostponeButtonProps = {
  post: Post;
};

export const PostDetailPostponeButton = ({ post }: PostDetailPostponeButtonProps) => {
  const { data: settings } = useSettingsQuery();
  const draftBlueskyMutation = useDraftBlueskyMutation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (
    post.channel.typeId !== 'bluesky' ||
    !settings?.postponeToken ||
    !settings?.blueskyUsername ||
    post.status !== 'draft'
  ) {
    return null;
  }

  const sendToPostpone = async () => {
    setShowSuccess(false);
    setError(null);

    try {
      await draftBlueskyMutation.mutateAsync({ postId: post.id });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Failed to send post to Postpone:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={sendToPostpone}
        className="w-full"
        isDisabled={draftBlueskyMutation.isPending}
        isLoading={draftBlueskyMutation.isPending}
      >
        <Send className="mr-2 h-4 w-4" />
        Send draft to Postpone
      </Button>
      {showSuccess && (
        <Alert variant="success" title="Success">
          The draft has been created in your Postpone account.
        </Alert>
      )}
      {error && (
        <Alert variant="error" title="Failed to send post to Postpone">
          {error}
        </Alert>
      )}
    </div>
  );
};

