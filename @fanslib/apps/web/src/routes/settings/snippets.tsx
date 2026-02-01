import type { FetchAllSnippetsResponse } from '@fanslib/server/schemas';
import { createFileRoute } from "@tanstack/react-router";
import { Edit, FileText, Globe, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { ScrollArea } from "~/components/ui/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";
import { Textarea } from "~/components/ui/Textarea";
import { useChannelsQuery } from "~/lib/queries/channels";
import {
  useCreateSnippetMutation,
  useDeleteSnippetMutation,
  useSnippetsQuery,
  useUpdateSnippetMutation,
} from "~/lib/queries/snippets";

type CaptionSnippet = FetchAllSnippetsResponse[number];

type SnippetFormData = {
  name: string;
  content: string;
  channelId?: string;
};

type Channel = {
  id: string;
  name: string;
};

const SnippetForm = ({
  initialData,
  onSubmit,
  onCancel,
  channels,
}: {
  initialData?: CaptionSnippet;
  onSubmit: (data: SnippetFormData) => Promise<void>;
  onCancel: () => void;
  channels: Channel[];
}) => {
  const [formData, setFormData] = useState<SnippetFormData>({
    name: initialData?.name ?? "",
    content: initialData?.content ?? "",
    channelId: initialData?.channel?.id ?? undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onCancel();
    } catch (error) {
      console.error("Error saving snippet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={formData.name}
          onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
          aria-label="Snippet name"
          placeholder="Snippet name..."
          isRequired
        />
      </div>

      <div>
        <label className="text-sm font-medium">Channel (optional)</label>
        <Select
          value={formData.channelId ?? "global"}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              channelId: value === "global" ? undefined : value,
            }))
          }
          aria-label="Snippet channel"
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a channel..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global (All Channels)</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Content</label>
        <Textarea
          value={formData.content}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="Snippet content..."
          className="min-h-[100px]"
          isRequired
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          isDisabled={isSubmitting || !formData.name.trim() || !formData.content.trim()}
        >
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

const SnippetSettings = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { data: snippets = [] } = useSnippetsQuery();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CaptionSnippet | null>(null);

  const createMutation = useCreateSnippetMutation();
  const updateMutation = useUpdateSnippetMutation();
  const deleteMutation = useDeleteSnippetMutation();

  const globalSnippets = (snippets ?? []).filter((s) => !s.channel);
  const channelSnippets = (snippets ?? []).filter((s) => s.channel);
  const groupedChannelSnippets = channelSnippets.reduce(
    (acc, snippet) => {
      const channelId = snippet.channel?.id;
      if (!channelId) return acc;
      acc[channelId] ??= [];
      acc[channelId].push(snippet);
      return acc;
    },
    {} as Record<string, CaptionSnippet[]>
  );

  const handleDeleteSnippet = async (snippet: CaptionSnippet) => {
    if (confirm(`Are you sure you want to delete "${snippet.name}"?`)) {
        await deleteMutation.mutateAsync({ id: snippet.id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <FileText /> Caption Snippets
            </h1>
            <p className="text-base-content/60">
              Create and manage reusable caption snippets for faster post creation
            </p>
          </div>
          <DialogTrigger isOpen={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Snippet
            </Button>
            <DialogModal>
              <Dialog>
                {({ close }) => (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create New Snippet</DialogTitle>
                    </DialogHeader>
                    <SnippetForm
                      channels={channels ?? []}
                      onSubmit={async (data) => {
                        await createMutation.mutateAsync(data);
                        close();
                      }}
                      onCancel={close}
                    />
                  </>
                )}
              </Dialog>
            </DialogModal>
          </DialogTrigger>
        </div>

        <ScrollArea className="h-[500px] p-4">
          <div className="space-y-6">
            {/* Global Snippets */}
            {globalSnippets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4" />
                  <h4 className="font-medium">Global Snippets</h4>
                </div>
                <div className="space-y-2">
                  {globalSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className="border rounded-lg p-3 hover:bg-base-300/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm">{snippet.name}</h5>
                          <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                            {snippet.content}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingSnippet(snippet)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteSnippet(snippet)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channel-Specific Snippets */}
            {Object.entries(groupedChannelSnippets).map(([channelId, channelSnippets]) => {
              const channel = (channels ?? []).find((c) => c.id === channelId);
              return (
                <div key={channelId}>
                  <div className="mb-3">
                    {channel ? (
                      <ChannelBadge
                        name={channel.name}
                        typeId={channel.type.id}
                        size="md"
                        className="inline-flex"
                      />
                    ) : (
                      <span className="font-medium">Unknown Channel</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {channelSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="border rounded-lg p-3 hover:bg-base-300/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm">{snippet.name}</h5>
                            <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                              {snippet.content}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingSnippet(snippet)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteSnippet(snippet)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {(snippets?.length === 0) && (
              <div className="text-center py-8 text-base-content/60">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No snippets created yet.</p>
                <p className="text-sm">Create your first snippet to get started!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Edit Dialog */}
        <DialogTrigger isOpen={!!editingSnippet} onOpenChange={(open) => !open && setEditingSnippet(null)}>
          <DialogModal>
            <Dialog>
              {({ close }) => (
                <>
                  <DialogHeader>
                    <DialogTitle>Edit Snippet</DialogTitle>
                  </DialogHeader>
                  {editingSnippet && (
                    <SnippetForm
                      initialData={editingSnippet}
                      channels={channels ?? []}
                      onSubmit={async (data) => {
                        await updateMutation.mutateAsync({ id: editingSnippet.id, updates: data });
                        close();
                      }}
                      onCancel={close}
                    />
                  )}
                </>
              )}
            </Dialog>
          </DialogModal>
        </DialogTrigger>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/settings/snippets")({
  component: SnippetSettings,
});
