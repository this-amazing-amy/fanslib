import type { MediaFilterSchema } from "@fanslib/server/schemas";
import { Copy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { useChannelsQuery } from "~/lib/queries/channels";

type MediaFilters = typeof MediaFilterSchema.static;

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

  const redditChannel = (channels ?? []).find((c) => c.typeId === REDDIT_CHANNEL_TYPE_ID);

  if (!redditChannel?.eligibleMediaFilter) {
    return null;
  }

  const applyRedditFilter = () => {
    onApplyFilter(redditChannel.eligibleMediaFilter);
  };

  return (
    <Tooltip
      content={<p>Copy the eligible media filter from the Reddit channel as a starting point</p>}
      openDelayMs={0}
    >
      <Button
        variant="ghost"
        size="sm"
        onPress={applyRedditFilter}
        isDisabled={disabled}
        className="flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
};
