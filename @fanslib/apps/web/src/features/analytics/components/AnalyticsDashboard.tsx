import { useState } from "react";
import { useOverlayTriggerState } from "react-stately";
import { cn } from "~/lib/cn";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { FypActionItemsSection } from "./FypActionItemsSection";
import { HealthDetailsDrawer } from "./HealthDetailsDrawer";
import { MatchingSection } from "./MatchingSection";

type TabId = "fyp" | "matching";

export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>("fyp");
  const healthDrawerState = useOverlayTriggerState({});

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <ConfidenceIndicator openDrawer={() => healthDrawerState.open()} />
      </div>

      <div className="px-4 py-3">
        <div className="tabs tabs-boxed w-fit">
          <button
            className={cn("tab", activeTab === "fyp" && "tab-active")}
            onClick={() => setActiveTab("fyp")}
          >
            FYP Actions
          </button>
          <button
            className={cn("tab", activeTab === "matching" && "tab-active")}
            onClick={() => setActiveTab("matching")}
          >
            Matching
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "fyp" && <FypActionItemsSection />}
        {activeTab === "matching" && <MatchingSection />}
      </div>

      <HealthDetailsDrawer state={healthDrawerState} />
    </div>
  );
};
