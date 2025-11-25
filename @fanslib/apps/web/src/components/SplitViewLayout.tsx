import { GripVertical, PanelRightClose, PanelRightOpen } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/cn";

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
  collapseIcon: _collapseIcon = <PanelRightClose className="h-4 w-4 transition-transform duration-300" />,
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

  const handleResize = useCallback(
    (size: number) => {
      if (!collapsible) return;
      
      const autoCollapseThreshold = 10;
      if (!isCollapsed && size <= autoCollapseThreshold) {
        setIsCollapsed(true);
        onCollapsedChange?.(true);
      } else if (isCollapsed && size > autoCollapseThreshold) {
        setIsCollapsed(false);
        onCollapsedChange?.(false);
      }
    },
    [isCollapsed, onCollapsedChange, collapsible]
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
        {collapsible && !isCollapsed && headerSlot && (
          <div className="flex items-center gap-2 py-6 px-6 flex-none">
            <div
              className={cn(
                shouldAnimate && "transition-opacity duration-300",
                "opacity-100"
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
            collapsible && !shouldAnimate && "transition-opacity duration-300",
            collapsible && isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          {children}
        </div>

        {collapsible && isCollapsed && (
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
  collapseButton,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
  collapseButton?: ReactNode;
}) => {
  const { setIsDragging } = useContext(ResizableContext);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ResizablePrimitive.PanelResizeHandle
        className={cn(
          "relative flex w-3 h-full cursor-col-resize items-center justify-center rounded-full bg-primary/30 transition-colors hover:bg-primary/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
          className
        )}
        onDragging={(isDragging) => {
          setIsDragging(isDragging);
        }}
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-10 w-5 items-center justify-center rounded-lg border border-primary/20 bg-base-100 shadow-md">
            <GripVertical className="h-3.5 w-3 text-primary/60" />
          </div>
        )}
      </ResizablePrimitive.PanelResizeHandle>
      {collapseButton && (
        <div
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-20 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {collapseButton}
        </div>
      )}
    </div>
  );
};

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
          <div className="flex h-full w-full flex-col overflow-hidden bg-base-100">
            {mainContentHeader && (
              <div className="flex items-center gap-2 py-6 px-6 flex-none">
                {mainContentHeader}
              </div>
            )}
            {mainContent}
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
              <div className="flex items-center gap-2 py-6 px-6 flex-none">
                {sideContentHeader}
              </div>
            )}
            {sideContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
