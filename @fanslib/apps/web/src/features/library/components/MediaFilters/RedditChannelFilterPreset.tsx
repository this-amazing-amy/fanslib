import { useChannelsQuery } from "~/lib/queries/channels";
import { Copy } from "lucide-react";
import type { MediaFilters } from "@fanslib/types";
import { Button } from "~/components/ui/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/Tooltip";

const REDDIT_CHANNEL_TYPE_ID = "reddit";

type RedditChannelFilterPresetProps = {
  onApplyFilter: (filter: MediaFilters | undefined) => void;
  disabled?: boolean;
};

export const RedditChannelFilterPreset = ({
  onApplyFilter,
  disabled = false,
}: RedditChannelFilterPresetProps) => {
  const { data: channels = [] } = useChannelsQuery();

  const redditChannel = channels.find((c) => c.typeId === REDDIT_CHANNEL_TYPE_ID);

  if (!redditChannel?.eligibleMediaFilter) {
    return null;
  }

  const applyRedditFilter = () => {
    onApplyFilter(redditChannel.eligibleMediaFilter);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onPress={applyRedditFilter}
            isDisabled={disabled}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy the eligible media filter from the Reddit channel as a starting point</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
