import { Eye, MoreHorizontal } from "lucide-react";
import type { Channel, ChannelSchema } from '@fanslib/server/schemas';
import { Button } from "~/components/ui/Button";
import { ChannelBadge } from "~/components/ChannelBadge";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";


type SwimlaneHiddenChannelsDropdownProps = {
  channels: Channel[];
};

export const SwimlaneHiddenChannelsDropdown = ({
  channels,
}: SwimlaneHiddenChannelsDropdownProps) => {
  const { preferences, updatePreferences } = usePostPreferences();

  const hiddenChannels = preferences.view.swimlane?.hiddenChannels ?? [];
  const savedChannelOrder = preferences.view.swimlane?.channelOrder;

  if (hiddenChannels.length === 0) {
    return null;
  }

  if (channels?.length === 0) {
    return null;
  }

  // Get all hidden channels first - match by ID
  const allHiddenChannels = channels.filter((c) => {
    if (!c?.id) return false;
    return hiddenChannels.includes(c.id);
  });

  // Then order them according to saved order
  const hiddenChannelsInOrder = allHiddenChannels.length > 0
    ? (savedChannelOrder && savedChannelOrder.length > 0
        ? savedChannelOrder
            .map((id) => allHiddenChannels.find((c) => c.id === id))
            .filter((c): c is NonNullable<typeof c> => c !== undefined)
            .concat(allHiddenChannels.filter((c) => !savedChannelOrder.includes(c.id)))
        : allHiddenChannels)
    : [];

  // Show dropdown even if we can't find channels (for debugging)
  // But show a helpful message if channels don't match
  const showDebugInfo = hiddenChannels.length > 0 && allHiddenChannels.length === 0;

  const showChannel = (channelId: string) => {
    const newHiddenChannels = hiddenChannels.filter((id) => id !== channelId);
    updatePreferences({
      view: {
        swimlane: {
          ...preferences.view.swimlane,
          hiddenChannels: newHiddenChannels,
        },
      },
    });
  };

  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-base-content/60 hover:text-base-content"
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="ml-1 text-xs">{hiddenChannelsInOrder.length}</span>
        <span className="ml-1 text-xs">hidden</span>
      </Button>
      <DropdownMenuPopover>
        <DropdownMenu>
          <DropdownMenuLabel>Hidden Channels</DropdownMenuLabel>
          {showDebugInfo ? (
            <DropdownMenuItem isDisabled>
              <div className="text-xs text-base-content/60">
                Channels not found (IDs: {hiddenChannels.join(", ")})
              </div>
            </DropdownMenuItem>
          ) : (
            hiddenChannelsInOrder.map((channel) => (
              <DropdownMenuItem
                key={channel.id}
                onAction={() => showChannel(channel.id)}
              >
                <div className="flex items-center gap-2">
                  <ChannelBadge
                    name={channel.name ?? ""}
                    typeId={channel.type?.id ?? channel.typeId ?? "onlyfans"}
                    size="sm"
                    selected
                    borderStyle="none"
                    responsive={false}
                  />
                  <Eye className="w-3 h-3 text-base-content/40" />
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenu>
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};

