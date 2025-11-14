import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "~/components/ui/Button/Button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/Dialog/Dialog";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { useChannelsQuery } from "~/lib/queries/channels";
import { ChannelView } from "./ChannelView";
import { CreateChannelForm } from "./CreateChannelForm";

export const Channels = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: channels, isLoading } = useChannelsQuery();

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Channels"
          description="Manage your content distribution channels"
        />
        <div className="text-center py-12 text-base-content/60">Loading channels...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Channels"
        description="Manage your content distribution channels and schedules"
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="primary">
                <PlusCircle className="w-5 h-5" />
                New Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Create New Channel</h3>
                  <p className="text-sm text-base-content/70 mt-1">
                    Select a channel type to get started
                  </p>
                </div>
                <CreateChannelForm onSuccess={handleCreateSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {channels && channels.length > 0 ? (
        <div className="space-y-6">
          {channels.map((channel) => (
            <ChannelView key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="card bg-base-200 p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-xl font-semibold">No channels yet</h3>
            <p className="text-base-content/70">
              Get started by creating your first content distribution channel
            </p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="primary" size="lg">
                  <PlusCircle className="w-5 h-5" />
                  Create Your First Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Create New Channel</h3>
                    <p className="text-sm text-base-content/70 mt-1">
                      Select a channel type to get started
                    </p>
                  </div>
                  <CreateChannelForm onSuccess={handleCreateSuccess} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
