import { SplitViewLayout } from "~/components/SplitViewLayout";
import { useOrchestrateLayout } from "~/hooks/useOrchestrateLayout";
import { OrchestratePane } from "./OrchestratePane";

export const OrchestratePage = () => {
  const { layout, setLeftPane, setRightPane, availableForLeft, availableForRight } = useOrchestrateLayout();

  return (
    <SplitViewLayout
      id="orchestrate"
      mainDefaultSize={50}
      sideDefaultSize={50}
      sideMinSize={25}
      sideMaxSize={75}
      mainMinSize={25}
      mainContent={
        <OrchestratePane
          view={layout.leftPane}
          availableViews={availableForLeft}
          onViewChange={setLeftPane}
        />
      }
      sideContent={
        <OrchestratePane
          view={layout.rightPane}
          availableViews={availableForRight}
          onViewChange={setRightPane}
        />
      }
    />
  );
};

