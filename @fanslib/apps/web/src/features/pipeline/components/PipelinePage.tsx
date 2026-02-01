import { addDays } from "date-fns";
import { useMemo, useState } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { TabNavigation } from "~/components/TabNavigation";
import { AssignmentStep } from "~/features/pipeline/components/AssignmentStep";
import { CaptioningStep } from "~/features/pipeline/components/CaptioningStep";

type PipelineTab = "assignment" | "captioning";

export const PipelinePage = () => {
  const [activeTab, setActiveTab] = useState<PipelineTab>("assignment");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [toDate, setToDate] = useState<Date>(() => addDays(new Date(), 21));

  const selectionState = useMemo(
    () => ({
      selectedChannelIds,
      fromDate,
      toDate,
    }),
    [selectedChannelIds, fromDate, toDate]
  );

  const tabs = [
    { id: "assignment" as PipelineTab, label: "Draft" },
    { id: "captioning" as PipelineTab, label: "Caption" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-8 pb-12 space-y-6">
      <TabNavigation tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} textSize="text-2xl" />
      <Card className="border-none">
        <CardBody className="space-y-4">
          {activeTab === "assignment" && (
            <AssignmentStep
              selectedChannelIds={selectionState.selectedChannelIds}
              onSelectedChannelIdsChange={setSelectedChannelIds}
              fromDate={selectionState.fromDate}
              toDate={selectionState.toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
            />
          )}
          {activeTab === "captioning" && (
            <CaptioningStep
              channelIds={selectionState.selectedChannelIds}
              fromDate={selectionState.fromDate}
              toDate={selectionState.toDate}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
