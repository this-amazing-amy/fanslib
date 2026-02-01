import type { Hashtag, HashtagChannelStats } from '@fanslib/server/schemas';
import { Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogModal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/AlertDialog";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Skeleton } from "~/components/ui/Skeleton";
import { cn } from "~/lib/cn";
import { formatViewCount, parseViewCount } from "~/lib/format-views";
import { useChannelsQuery } from "~/lib/queries/channels";
import {
  useCreateHashtagMutation,
  useDeleteHashtagMutation,
  useHashtagsQuery,
  useUpdateHashtagStatsMutation,
} from "~/lib/queries/hashtags";

type HashtagViewInputProps = {
  initialValue: number;
  onViewCountChange: (newValue: number) => void;
  disabled?: boolean;
};

const HashtagViewInput = ({
  initialValue,
  onViewCountChange,
  disabled = false,
}: HashtagViewInputProps) => {
  const [value, setValue] = useState(formatViewCount(initialValue));
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    if (disabled) return;
    setIsEditing(true);
    setValue(formatViewCount(initialValue));
  };

  const commitEdit = () => {
    if (!isEditing) return;

    const parsedValue = parseViewCount(value);
    if (parsedValue === null) {
      setValue(formatViewCount(initialValue));
    } else {
      onViewCountChange(parsedValue);
    }
    setIsEditing(false);
  };

  return (
    <Input
      value={value}
      variant="ghost"
      isDisabled={disabled}
      aria-label="Hashtag views"
      onFocus={startEditing}
      onChange={(value) => setValue(value)}
      onBlur={commitEdit}
      className="text-center"
    />
  );
};

type DeleteHashtagButtonProps = {
  hashtagId: number;
  hashtagName: string;
};

const DeleteHashtagButton = ({ hashtagId, hashtagName }: DeleteHashtagButtonProps) => {
  const deleteHashtagMutation = useDeleteHashtagMutation();

  const deleteHashtag = async () => {
    await deleteHashtagMutation.mutateAsync({ id: hashtagId.toString() });
  };

  return (
    <AlertDialogTrigger>
      <div className="p-2 pr-4 h-12 flex items-center justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-base-content/60 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <AlertDialogModal isDismissable={false}>
        <AlertDialog>
          {({ close }) => (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Hashtag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete #{hashtagName}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onPress={async () => {
                    await deleteHashtag();
                    close();
                  }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialog>
      </AlertDialogModal>
    </AlertDialogTrigger>
  );
};

const NewHashtagRow = () => {
  const [newHashtagName, setNewHashtagName] = useState("");
  const createHashtagMutation = useCreateHashtagMutation();

  const createHashtag = async () => {
    if (!newHashtagName.trim()) return;

    await createHashtagMutation.mutateAsync({ name: newHashtagName });
    setNewHashtagName("");
  };

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      createHashtag();
    }
  };

  return (
    <div className="p-2 px-4 h-12 flex items-center gap-2 w-full">
      <Input
        value={newHashtagName}
        onChange={(value) => setNewHashtagName(value)}
        aria-label="New hashtag name"
        onKeyDown={keyDown}
        placeholder="Add new hashtag..."
        variant="ghost"
        className="h-8"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onPress={createHashtag}
        isDisabled={!newHashtagName.trim()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const HashtagsTab = () => {
  const { data: channels = [], isPending: isLoadingChannels } = useChannelsQuery();
  const { data: hashtags = [], isPending: isLoadingHashtags } = useHashtagsQuery();
  const updateHashtagStatsMutation = useUpdateHashtagStatsMutation();

  const fanslyChannels = (channels ?? []).filter((channel) => channel.typeId === "fansly");

  const updateHashtagStats = async (hashtagId: number, channelId: string, viewCount: number) => {
    await updateHashtagStatsMutation.mutateAsync({ id: hashtagId.toString(), updates: { channelId, views: viewCount } });
  };

  const getViewCount = (hashtag: Hashtag, channelId: string) => {
    const stat = hashtag.channelStats?.find((s: HashtagChannelStats) => s.channelId === channelId);
    return stat?.views ?? 0;
  };

  if (isLoadingChannels || isLoadingHashtags) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global Hashtags Table */}
      <div className="space-y-4">
        <div className="rounded-lg border border-base-300">
          {/* Header */}
          <div className={cn("grid grid-cols-[1fr_5fr_auto] border-b border-base-300")}>
            <div className="p-2 pl-4 h-12 flex items-center text-base-content/60">Hashtag</div>
            <div
              className="grid grid-cols-[repeat(var(--channel-count),_1fr)]"
              style={{ "--channel-count": fanslyChannels.length } as CSSProperties}
            >
              {fanslyChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="p-2 h-12 flex items-center justify-start text-base-content/60"
                >
                  <div className="flex items-center gap-2">
                    <ChannelBadge size="sm" name={channel.name} typeId={channel.typeId} />
                    <span className="text-xs">views</span>
                  </div>
                </div>
              ))}
            </div>
            <div />
          </div>

          {/* Hashtag Rows */}
          {(hashtags ?? []).map((hashtag, i) => (
            <div
              key={hashtag.id}
              className={cn("grid grid-cols-[1fr_5fr_auto]", i % 2 === 0 && "bg-base-200/50")}
            >
              <div className="p-2 pl-4 h-12 flex items-center">
                <Badge variant="secondary">#{hashtag.name}</Badge>
              </div>
              <div
                className="grid grid-cols-[repeat(var(--channel-count),_1fr)]"
                style={{ "--channel-count": fanslyChannels.length } as CSSProperties}
              >
                {fanslyChannels.map((channel) => (
                  <div key={channel.id} className="p-2 h-12 max-w-48 flex items-center justify-start">
                    <HashtagViewInput
                      initialValue={getViewCount(hashtag as unknown as Hashtag & { createdAt: Date; updatedAt: Date }, channel.id)}
                      onViewCountChange={(newValue) =>
                        updateHashtagStats(hashtag.id, channel.id, newValue)
                      }
                    />
                  </div>
                ))}
              </div>
              <DeleteHashtagButton hashtagId={hashtag.id} hashtagName={hashtag.name} />
            </div>
          ))}

          {/* New Hashtag Row */}
          <NewHashtagRow />
        </div>
      </div>
    </div>
  );
};
