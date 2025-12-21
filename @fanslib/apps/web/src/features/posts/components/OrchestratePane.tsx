import type { PaneView } from "~/hooks/useOrchestrateLayout";
import { LibraryContent } from "~/features/library/components/LibraryContent";
import { ShootsContent } from "~/features/shoots/components/ShootsContent";
import { PlanContent } from "./PlanContent";
import { TabNavigation } from "~/components/TabNavigation";

type OrchestratePaneProps = {
  view: PaneView;
  availableViews: PaneView[];
  onViewChange: (view: PaneView) => void;
};

const viewLabels: Record<PaneView, string> = {
  library: "Library",
  shoots: "Shoots",
  plan: "Plan",
};

export const OrchestratePane = ({ view, availableViews, onViewChange }: OrchestratePaneProps) => {
  const renderContent = () => {
    switch (view) {
      case "library":
        return <LibraryContent />;
      case "shoots":
        return <ShootsContent />;
      case "plan":
        return <PlanContent />;
    }
  };

  const tabs = availableViews.map((availableView) => ({
    id: availableView,
    label: viewLabels[availableView],
  }));

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-none px-6 py-4">
        <TabNavigation tabs={tabs} activeTabId={view} onTabChange={onViewChange} textSize="text-xl" />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

