import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogModal, DialogTitle } from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { useCreateSubredditMutation } from "~/lib/queries/subreddits";

type CreateSubredditDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubredditCreated: () => void;
};

export const CreateSubredditDialog = ({
  isOpen,
  onOpenChange,
  onSubredditCreated,
}: CreateSubredditDialogProps) => {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const createSubredditMutation = useCreateSubredditMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      console.error("Subreddit name is required");
      return;
    }

    try {
      await createSubredditMutation.mutateAsync({
        name: name.trim(),
        notes: notes.trim() || null,
      });

      console.log(`Subreddit r/${name} created successfully`);

      setName("");
      setNotes("");
      onSubredditCreated();
    } catch (error) {
      console.error("Failed to create subreddit:", error);
    }
  };

  return (
    <DialogModal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog>
        {({ close }) => (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Subreddit</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subreddit Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-base-content/60">r/</span>
                    <Input
                      value={name}
                      onChange={(value) => setName(value as string)}
                      aria-label="Subreddit name"
                      placeholder="subredditname"
                      className="flex-1"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <Input
                    value={notes}
                    onChange={(value) => setNotes(value as string)}
                    aria-label="Subreddit notes"
                    placeholder="Brief notes about the subreddit"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onPress={close} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={createSubredditMutation.isPending}
              >
                {createSubredditMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </DialogModal>
  );
};
