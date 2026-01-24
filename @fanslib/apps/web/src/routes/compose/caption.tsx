import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { CaptioningStep } from "~/features/pipeline/components/CaptioningStep";
import { useChannelsQuery } from "~/lib/queries/channels";

const CaptionRoute = () => {
  const { data: channelsData } = useChannelsQuery();
  const channels = channelsData ?? [];
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [captionRefreshKey, setCaptionRefreshKey] = useState(0);

  const allChannelIds = useMemo(
    () => channels.map((channel) => channel.id),
    [channels]
  );

  const channelIds = selectedChannelIds.length > 0 ? selectedChannelIds : allChannelIds;

  return (
    <PostPreferencesProvider>
      <MediaSelectionProvider media={[]}>
        <MediaDragProvider>
          <Card className="border-none">
            <CardBody className="space-y-4">
              <CaptioningStep
                channelIds={channelIds}
                fromDate={new Date()}
                toDate={new Date()}
                refreshKey={captionRefreshKey}
              />
            </CardBody>
          </Card>
        </MediaDragProvider>
      </MediaSelectionProvider>
    </PostPreferencesProvider>
  );
};

export const Route = createFileRoute("/compose/caption")({
  component: CaptionRoute,
});
