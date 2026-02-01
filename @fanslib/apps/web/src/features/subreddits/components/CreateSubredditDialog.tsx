import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
} from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { VERIFICATION_STATUS, type VerificationStatusType } from '~/components/VerificationStatus';
import { useCreateSubredditMutation, useAnalyzePostingTimesMutation } from '~/lib/queries/subreddits';

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
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [postFrequencyHours, setPostFrequencyHours] = useState('24');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusType>(
    VERIFICATION_STATUS.UNKNOWN
  );
  const [defaultFlair, setDefaultFlair] = useState('');
  const [captionPrefix, setCaptionPrefix] = useState('');

  const createSubredditMutation = useCreateSubredditMutation();
  const analyzePostingTimesMutation = useAnalyzePostingTimesMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      console.error('Subreddit name is required');
      return;
    }

    try {
      const parsedFrequency = postFrequencyHours ? parseInt(postFrequencyHours) : null;

      const result = await createSubredditMutation.mutateAsync({
        name: name.trim(),
        notes: notes.trim() || null,
        maxPostFrequencyHours: parsedFrequency,
        defaultFlair: defaultFlair.trim() || null,
        captionPrefix: captionPrefix.trim() || null,
      } as unknown as Parameters<typeof createSubredditMutation.mutateAsync>[0]);

      console.log(`Subreddit r/${name} created successfully`);

      // Auto-analyze posting times in the background (non-blocking)
      if (result) {
        analyzePostingTimesMutation.mutate({
          subredditId: result.id,
          subredditName: result.name,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }

      // Reset form
      setName('');
      setNotes('');
      setMemberCount('');
      setPostFrequencyHours('24');
      setVerificationStatus(VERIFICATION_STATUS.UNKNOWN);
      setDefaultFlair('');
      setCaptionPrefix('');
      onSubredditCreated();
    } catch (error) {
      console.error('Failed to create subreddit:', error);
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
                    Subreddit Name<span className="text-error">*</span>
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
                  <label className="block text-sm font-medium mb-2">Member Count</label>
                  <Input
                    value={memberCount}
                    onChange={(value) => setMemberCount(value as string)}
                    aria-label="Member count"
                    placeholder="e.g., 120K"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Post Frequency (hours)
                  </label>
                  <Input
                    type="number"
                    value={postFrequencyHours}
                    onChange={(value) => setPostFrequencyHours(value as string)}
                    aria-label="Post frequency"
                    placeholder="24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as VerificationStatusType)}
                    className="select select-bordered w-full"
                  >
                    {Object.values(VERIFICATION_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Default Flair</label>
                  <Input
                    value={defaultFlair}
                    onChange={(value) => setDefaultFlair(value as string)}
                    aria-label="Default flair"
                    placeholder="Post flair text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Caption Prefix</label>
                  <Input
                    value={captionPrefix}
                    onChange={(value) => setCaptionPrefix(value as string)}
                    aria-label="Caption prefix"
                    placeholder="Text prepended to captions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
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
              <Button type="submit" isDisabled={createSubredditMutation.isPending}>
                {createSubredditMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </DialogModal>
  );
};
