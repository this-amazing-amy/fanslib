import type { Channel, ChannelSchema, ContentScheduleWithChannel, ContentScheduleWithChannelSchema, CreateContentScheduleRequestBody, CreateContentScheduleRequestBodySchema, Hashtag, HashtagSchema, MediaFilter, MediaFilterSchema } from '@fanslib/server/schemas';
import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button/Button";
import {
    Dialog,
    DialogModal,
    DialogTrigger,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input/Input";
import { Textarea } from "~/components/ui/Textarea";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { MediaFilters as MediaFiltersComponent } from "~/features/library/components/MediaFilters/MediaFilters";
import { MediaFiltersProvider } from "~/features/library/components/MediaFilters/MediaFiltersContext";
import { useDeleteChannelMutation, useUpdateChannelMutation } from "~/lib/queries/channels";
import {
    useContentSchedulesByChannelQuery,
    useCreateContentScheduleMutation,
    useUpdateContentScheduleMutation,
} from "~/lib/queries/content-schedules";
import { ChannelTypeIcon } from "./ChannelTypeIcon";
import { ContentScheduleForm } from "./ContentScheduleForm";
import { ContentScheduleList } from "./ContentScheduleList";
import { HashtagSelector } from "./HashtagSelector";


type MediaFilters = MediaFilter;

type ChannelViewProps = {
  channel: Channel;
  onDelete?: () => void;
};

type ContentSchedule = ContentScheduleWithChannel;

export const ChannelView = ({ channel, onDelete }: ChannelViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [eligibleMediaFilter, setEligibleMediaFilter] = useState<MediaFilters>(
    channel.eligibleMediaFilter ?? []
  );
  const [defaultHashtags, setDefaultHashtags] = useState<Hashtag[]>(
    channel.defaultHashtags ?? []
  );
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ContentSchedule | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateChannel = useUpdateChannelMutation();
  const deleteChannel = useDeleteChannelMutation();
  const createSchedule = useCreateContentScheduleMutation();
  const updateSchedule = useUpdateContentScheduleMutation();

  const { data: schedules, isLoading: isLoadingSchedules } = useContentSchedulesByChannelQuery(channel.id);

  useEffect(() => {
    setName(channel.name);
    setDescription(channel.description ?? "");
    setEligibleMediaFilter(channel.eligibleMediaFilter ?? []);
    setDefaultHashtags(channel.defaultHashtags ?? []);
  }, [channel]);

  const handleSave = async () => {
    try {
      await updateChannel.mutateAsync({
        id: channel.id,
        updates: {
          name,
          description: description ?? undefined,
          eligibleMediaFilter: eligibleMediaFilter.length > 0 ? eligibleMediaFilter : undefined,
          defaultHashtags: defaultHashtags.map((h) => h.name),
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update channel:", error);
    }
  };

  const handleCancel = () => {
    setName(channel.name);
    setDescription(channel.description ?? "");
    setEligibleMediaFilter(channel.eligibleMediaFilter ?? []);
    setDefaultHashtags(channel.defaultHashtags ?? []);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteChannel.mutateAsync({ id: channel.id });
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete channel:", error);
    }
  };

  const handleCreateSchedule = async (data: CreateContentScheduleRequestBody) => {
    try {
      await createSchedule.mutateAsync(data);
      setShowScheduleForm(false);
    } catch (error) {
      console.error("Failed to create schedule:", error);
    }
  };

  const handleUpdateSchedule = async (data: CreateContentScheduleRequestBody) => {
    if (!editingSchedule) return;

    try {
      await updateSchedule.mutateAsync({
        id: editingSchedule.id,
        updates: data,
      });
      setShowScheduleForm(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error("Failed to update schedule:", error);
    }
  };

  const handleEditSchedule = (schedule: ContentSchedule) => {
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const handleCancelScheduleForm = () => {
    setShowScheduleForm(false);
    setEditingSchedule(null);
  };

  return (
    <div className="card bg-base-100 border-2 border-base-300">
      {/* Header */}
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ChannelTypeIcon typeId={channel.typeId} className="w-8 h-8" />
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={name}
                  onChange={(value) => setName(value)}
                  placeholder="Channel name"
                  className="font-semibold"
                />
                <Textarea
                  value={description}
                  onChange={(value) => setDescription(value)}
                  placeholder="Channel description (optional)"
                  rows={2}
                />
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{channel.name}</h3>
                {channel.description && (
                  <p className="text-sm text-base-content/70">{channel.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleSave}
                  isDisabled={updateChannel.isPending}
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onPress={handleCancel}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onPress={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <DialogTrigger isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                  <DialogModal>
                    <Dialog>
                      {({ close }) => (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Delete Channel</h3>
                          <p>
                            Are you sure you want to delete this channel? This action cannot be undone.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onPress={close}>
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onPress={async () => {
                                await handleDelete();
                                close();
                              }}
                              isDisabled={deleteChannel.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Dialog>
                  </DialogModal>
                </DialogTrigger>
              </>
            )}
          </div>
        </div>

        {/* Eligible Media Filters */}
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Eligible Media Filters</h4>
          <p className="text-sm text-base-content/70 mb-4">
            Define which media items are eligible for this channel
          </p>
          {isEditing ? (
            <FilterPresetProvider onFiltersChange={setEligibleMediaFilter}>
              <MediaFiltersProvider
                value={eligibleMediaFilter}
                onChange={setEligibleMediaFilter}
              >
                <MediaFiltersComponent />
              </MediaFiltersProvider>
            </FilterPresetProvider>
          ) : (
            <div className="card bg-base-200 p-4">
              {eligibleMediaFilter.length > 0 ? (
                <FilterPresetProvider onFiltersChange={() => {}}>
                  <MediaFiltersProvider
                    value={eligibleMediaFilter}
                    onChange={() => {}}
                  >
                    <MediaFiltersComponent />
                  </MediaFiltersProvider>
                </FilterPresetProvider>
              ) : (
                <p className="text-sm text-base-content/60">No filters configured</p>
              )}
            </div>
          )}
        </div>

        {/* Default Hashtags */}
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Default Hashtags</h4>
          <p className="text-sm text-base-content/70 mb-4">
            Hashtags that will be automatically added to posts for this channel
          </p>
          {isEditing ? (
            <HashtagSelector
              value={defaultHashtags}
              onChange={setDefaultHashtags}
              disabled={updateChannel.isPending}
            />
          ) : (
            <div className="card bg-base-200 p-4">
              {defaultHashtags.length > 0 ? (
                <p className="text-sm text-base-content">
                  {defaultHashtags.map((hashtag) => hashtag.name).join(" ")}
                </p>
              ) : (
                <p className="text-sm text-base-content/60">No default hashtags configured</p>
              )}
            </div>
          )}
        </div>

        {/* Content Schedules */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Content Schedules</h4>
            {!showScheduleForm && (
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setShowScheduleForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add Schedule
              </Button>
            )}
          </div>

          {showScheduleForm ? (
            <div className="card bg-base-200 p-6">
              <ContentScheduleForm
                channelId={channel.id}
                schedule={editingSchedule ?? undefined}
                onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                onCancel={handleCancelScheduleForm}
              />
            </div>
          ) : isLoadingSchedules ? (
            <div className="text-center py-8 text-base-content/60">Loading schedules...</div>
          ) : schedules && schedules.length > 0 ? (
            <ContentScheduleList schedules={schedules} onEdit={handleEditSchedule} />
          ) : (
            <div className="card bg-base-200 p-8 text-center text-base-content/60">
              No content schedules configured. Add one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
