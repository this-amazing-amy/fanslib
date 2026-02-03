import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { CaptioningStep } from "~/features/pipeline/components/CaptioningStep";
import { useChannelsQuery } from "~/lib/queries/channels";

const CaptioningRoute = () => {
  const { data: channelsData } = useChannelsQuery();
  const channels = useMemo(() => channelsData ?? [], [channelsData]);

  const allChannelIds = useMemo(
    () => channels.map((channel) => channel.id),
    [channels]
  );

  const channelIds = allChannelIds;

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
              />
            </CardBody>
          </Card>
        </MediaDragProvider>
      </MediaSelectionProvider>
    </PostPreferencesProvider>
  );
};

export const Route = createFileRoute("/captioning")({
  component: CaptioningRoute,
});
