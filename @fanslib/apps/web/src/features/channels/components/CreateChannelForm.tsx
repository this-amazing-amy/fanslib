import { useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { CHANNEL_TYPES } from "@fanslib/server/constants";
import { useCreateChannelMutation } from "~/lib/queries/channels";
import { Badge } from "~/components/ui/Badge/Badge";
import { ChannelTypeIcon } from "./ChannelTypeIcon";
import { cn } from "~/lib/cn";

type CreateChannelFormProps = {
  onSuccess?: () => void;
};

export const CreateChannelForm = ({ onSuccess }: CreateChannelFormProps) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const createChannel = useCreateChannelMutation();

  const handleChannelTypeClick = async (typeId: string) => {
    const channelType = CHANNEL_TYPES[typeId as keyof typeof CHANNEL_TYPES];
    if (!channelType) return;

    setSelectedTypeId(typeId);

    try {
      await createChannel.mutateAsync({
        name: channelType.name,
        typeId,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(CHANNEL_TYPES).map(([typeId, channelType]) => (
        <AriaButton
          key={typeId}
          onPress={() => handleChannelTypeClick(typeId)}
          isDisabled={createChannel.isPending}
          className={cn(
            "card bg-base-200 p-4 transition-all hover:bg-base-300 hover:scale-105",
            "flex flex-col items-center gap-3 cursor-pointer outline-none",
            selectedTypeId === typeId && "ring-2 ring-primary",
            createChannel.isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChannelTypeIcon typeId={typeId} className="w-12 h-12" />
          <Badge variant="neutral">{channelType.name}</Badge>
        </AriaButton>
      ))}
    </div>
  );
};
