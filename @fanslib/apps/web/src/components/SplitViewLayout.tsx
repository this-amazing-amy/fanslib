import { GripVertical, PanelRightClose, PanelRightOpen } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";
import { cn } from "~/lib/cn";
import { Button } from "~/components/ui/Button";

type ResizableContextType = {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

const ResizableContext = createContext<ResizableContextType>({
  isDragging: false,
  setIsDragging: () => undefined,
});

type ResizablePanelGroupProps = React.ComponentProps<typeof ResizablePrimitive.PanelGroup> & {
  id: string;
};

const ResizablePanelGroup = ({ className, id, ...props }: ResizablePanelGroupProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [shouldSaveLayout, setShouldSaveLayout] = useState(false);

  useEffect(() => {
    if (shouldSaveLayout) return;
    setTimeout(() => {
      setShouldSaveLayout(true);
    }, 1000);
  }, [shouldSaveLayout]);

  return (
    <ResizableContext.Provider value={{ isDragging, setIsDragging }}>
      <ResizablePrimitive.PanelGroup
        onLayout={(layout) => {
          if (!shouldSaveLayout) return;
          saveLayoutToLocalStorage(id, layout);
        }}
        className={cn(
          "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
          className
        )}
        {...props}
      />
    </ResizableContext.Provider>
  );
};

type ResizablePanelProps = React.ComponentProps<typeof ResizablePrimitive.Panel> & {
  isFirst: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapsedSize?: number;
  headerSlot?: ReactNode;
  groupRef?: React.RefObject<ResizablePrimitive.ImperativePanelGroupHandle>;
  panelIndex?: number;
  collapseIcon?: ReactNode;
  expandIcon?: ReactNode;
};

const saveLayoutToLocalStorage = (id: string, layout: number[]) => {
  localStorage.setItem(`resizable-layout-${id}`, JSON.stringify(layout));
};

const getLayoutFromLocalStorage = (id: string): number[] | null => {
  const layout = localStorage.getItem(`resizable-layout-${id}`);
  return layout ? JSON.parse(layout) : null;
};

const ResizablePanel = ({
  id,
  isFirst,
  className,
  children,
  collapsible,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsedSize = 3,
  headerSlot,
  defaultSize = 30,
  groupRef,
  panelIndex,
  collapseIcon = <PanelRightClose className="h-4 w-4 transition-transform duration-300" />,
  expandIcon = <PanelRightOpen className="h-4 w-4 transition-transform duration-300" />,
  ...props
}: ResizablePanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [previousSize, setPreviousSize] = useState(defaultSize);
  const { isDragging } = useContext(ResizableContext);

  const [animationDelayPassed, setAnimationDelayPassed] = useState(false);

  useEffect(() => {
    if (!groupRef?.current) return;
    if (!isFirst) return;
    if (!id) return;

    const layout = getLayoutFromLocalStorage(id);
    if (layout && groupRef.current) {
      groupRef.current.setLayout(layout);
    }
  }, [groupRef, id, isFirst]);

  const autoCollapseThreshold = 10;

  const handleResize = useCallback(
    (size: number) => {
      if (!isCollapsed && size <= autoCollapseThreshold) {
        setIsCollapsed(true);
        onCollapsedChange?.(true);
      } else if (isCollapsed && size > autoCollapseThreshold) {
        setIsCollapsed(false);
        onCollapsedChange?.(false);
      }
    },
    [isCollapsed, onCollapsedChange]
  );

  const toggleCollapse = useCallback(() => {
    if (!groupRef?.current || typeof panelIndex !== "number") return;

    const newCollapsed = !isCollapsed;
    const currentSizes = groupRef.current.getLayout();

    if (newCollapsed) {
      if (currentSizes[panelIndex] !== undefined) {
        setPreviousSize(currentSizes[panelIndex]);
      }
      const newSizes = [...currentSizes];
      newSizes[panelIndex] = collapsedSize;
      newSizes[panelIndex === 0 ? 1 : 0] = 100 - collapsedSize;
      groupRef.current.setLayout(newSizes);
    } else {
      const newSizes = [...currentSizes];
      newSizes[panelIndex] = previousSize;
      newSizes[panelIndex === 0 ? 1 : 0] = 100 - previousSize;
      groupRef.current.setLayout(newSizes);
    }

    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  }, [isCollapsed, collapsedSize, previousSize, groupRef, panelIndex, onCollapsedChange]);

  useEffect(() => {
    if (animationDelayPassed) return;

    setTimeout(() => {
      setAnimationDelayPassed(true);
    }, 100);
  }, [animationDelayPassed]);

  const shouldAnimate = !isDragging && animationDelayPassed;

  return (
    <ResizablePrimitive.Panel
      className={cn(
        "relative flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        shouldAnimate && "transition-all duration-300 ease-in-out",
        isCollapsed && "cursor-pointer hover:bg-accent/50",
        className
      )}
      defaultSize={defaultSize}
      minSize={isCollapsed ? collapsedSize : props.minSize}
      onResize={handleResize}
      onClick={isCollapsed ? toggleCollapse : undefined}
      {...props}
    >
      <div className="h-full w-full flex flex-col">
        {collapsible && (
          <div className="flex items-center gap-2 py-6 px-6 flex-none">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse();
                }}
                className="h-6 w-6"
              >
                {collapseIcon}
              </Button>
            )}
            <div
              className={cn(
                shouldAnimate && "transition-opacity duration-300",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              {headerSlot}
            </div>
          </div>
        )}
        <div
          className={cn(
            "flex-1 min-h-0",
            !collapsible && "h-full",
            !shouldAnimate && "transition-opacity duration-300",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          {children}
        </div>

        {isCollapsed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "rounded-full bg-accent/10 p-2",
                !shouldAnimate && "transition-colors",
                "hover:bg-accent/20"
              )}
            >
              {expandIcon}
            </div>
          </div>
        )}
      </div>
    </ResizablePrimitive.Panel>
  );
};

const ResizableHandle = ({
  className,
  withHandle,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => {
  const { setIsDragging } = useContext(ResizableContext);

  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      onDragging={(isDragging) => {
        setIsDragging(isDragging);
      }}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

type SplitViewLayoutProps = {
  id: string;
  mainContent: ReactNode;
  sideContent: ReactNode;
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
  sideContentHeader,
  mainDefaultSize = 70,
  sideDefaultSize = 30,
  mainMinSize = 30,
  sideMinSize = 3,
  sideMaxSize = 50,
}: SplitViewLayoutProps) => {
  const panelGroupRef = React.useRef<ResizablePrimitive.ImperativePanelGroupHandle>(null);

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
          {mainContent}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          id={id}
          isFirst={false}
          defaultSize={sideDefaultSize}
          minSize={sideMinSize}
          maxSize={sideMaxSize}
          collapsible
          headerSlot={sideContentHeader}
          panelIndex={1}
          groupRef={panelGroupRef as React.RefObject<ImperativePanelGroupHandle>}
        >
          {sideContent}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
