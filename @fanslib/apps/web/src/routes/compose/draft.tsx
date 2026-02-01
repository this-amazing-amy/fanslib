import { createFileRoute } from "@tanstack/react-router";
import { addDays } from "date-fns";
import { useState } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { AssignmentStep } from "~/features/pipeline/components/AssignmentStep";

const DraftRoute = () => {
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [toDate, setToDate] = useState<Date>(() => addDays(new Date(), 21));

  return (
    <PostPreferencesProvider>
      <MediaSelectionProvider media={[]}>
        <MediaDragProvider>
          <Card className="border-none">
            <CardBody className="space-y-4">
              <AssignmentStep
                selectedChannelIds={selectedChannelIds}
                onSelectedChannelIdsChange={setSelectedChannelIds}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
              />
            </CardBody>
          </Card>
        </MediaDragProvider>
      </MediaSelectionProvider>
    </PostPreferencesProvider>
  );
};

export const Route = createFileRoute("/compose/draft")({
  component: DraftRoute,
});
