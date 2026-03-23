import { ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
} from "~/components/ui/Dialog";
import { useRemoveFromFypMutation } from "~/lib/queries/posts";

const fanslyPostPageUrl = (fanslyPostId: string) => `https://fansly.com/post/${fanslyPostId}`;

type RemoveFromFypDialogProps = {
  postId: string | null;
  fanslyPostId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const RemoveFromFypDialog = ({
  postId,
  fanslyPostId,
  isOpen,
  onOpenChange,
}: RemoveFromFypDialogProps) => {
  const removeFromFyp = useRemoveFromFypMutation();
  const fanslyUrl = fanslyPostId ? fanslyPostPageUrl(fanslyPostId) : null;

  return (
    <DialogModal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog maxWidth="md">
        {({ close }) => (
          <>
            <DialogHeader>
              <DialogTitle>Remove FYP promotion</DialogTitle>
              <DialogDescription>
                FansLib cannot turn off FYP for you on Fansly. Open the post on Fansly, remove FYP
                promotion there, then confirm below so we stop treating this post as active on FYP.
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              {fanslyUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-base-content/80">Open this post on Fansly:</p>
                  <a
                    href={fanslyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary break-all underline underline-offset-2 hover:opacity-90"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                    {fanslyUrl}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-base-content/80">
                  We do not have a Fansly post ID for this post yet. On Fansly, find this post in
                  your content and remove FYP promotion from there, then confirm below.
                </p>
              )}
            </DialogBody>

            <DialogFooter>
              <Button variant="ghost" onPress={close} isDisabled={removeFromFyp.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  if (!postId) return;
                  removeFromFyp.mutate(postId, { onSuccess: close });
                }}
                isDisabled={removeFromFyp.isPending || !postId}
              >
                {removeFromFyp.isPending ? "Saving…" : "I removed it on Fansly — confirm"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </DialogModal>
  );
};
