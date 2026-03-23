import React, { type ReactNode } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { ResizablePanelGroup } from "./ResizableContext";
import { ResizableHandle } from "./ResizableHandle";
import { ResizablePanel } from "./ResizablePanel";

type SplitViewLayoutProps = {
  id: string;
  mainContent: ReactNode;
  sideContent: ReactNode;
  mainContentHeader?: ReactNode;
  sideContentHeader?: ReactNode;
  mainDefaultSize?: number;
  sideDefaultSize?: number;
  mainMinSize?: number;
  sideMinSize?: number;
  sideMaxSize?: number;
};

export const SplitViewLayout = ({
  id,
  mainContent,
  sideContent,
  mainContentHeader,
  sideContentHeader,
  mainDefaultSize = 70,
  sideDefaultSize = 30,
  mainMinSize = 30,
  sideMinSize = 3,
  sideMaxSize = 50,
}: SplitViewLayoutProps) => {
  const panelGroupRef = React.useRef<ImperativePanelGroupHandle>(null);

  return (
    <div className="h-full w-full overflow-hidden">
      <ResizablePanelGroup id={id} direction="horizontal" ref={panelGroupRef}>
        <ResizablePanel
          id={id}
          isFirst
          defaultSize={mainDefaultSize}
          minSize={mainMinSize}
          panelIndex={0}
          groupRef={panelGroupRef as React.RefObject<ImperativePanelGroupHandle>}
        >
          <div className="flex h-full w-full flex-col overflow-hidden bg-base-100">
            {mainContentHeader && (
              <div className="flex items-center gap-2 py-6 px-6 flex-none">{mainContentHeader}</div>
            )}
            <ScrollArea className="flex-1 min-h-0">{mainContent}</ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="mx-2" />
        <ResizablePanel
          id={id}
          isFirst={false}
          defaultSize={sideDefaultSize}
          minSize={sideMinSize}
          maxSize={sideMaxSize}
          panelIndex={1}
          groupRef={panelGroupRef as React.RefObject<ImperativePanelGroupHandle>}
        >
          <div className="flex h-full w-full flex-col overflow-hidden bg-base-100">
            {sideContentHeader && (
              <div className="flex items-center gap-2 py-6 px-6 flex-none">{sideContentHeader}</div>
            )}
            <ScrollArea className="flex-1 min-h-0">{sideContent}</ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
