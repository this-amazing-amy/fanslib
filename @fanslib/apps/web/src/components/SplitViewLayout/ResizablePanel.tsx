import { PanelRightClose, PanelRightOpen } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/cn";
import { ResizableContext } from "./ResizableContext";
import { getLayoutFromLocalStorage } from "./layout-persistence";

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

export const ResizablePanel = ({
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
  collapseIcon: _collapseIcon = (
    <PanelRightClose className="h-4 w-4 transition-transform duration-300" />
  ),
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
    [isCollapsed, onCollapsedChange, collapsible],
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
        className,
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
            <div className={cn(shouldAnimate && "transition-opacity duration-300", "opacity-100")}>
              {headerSlot}
            </div>
          </div>
        )}
        <div
          className={cn(
            "flex-1 min-h-0",
            !collapsible && "h-full",
            collapsible && !shouldAnimate && "transition-opacity duration-300",
            collapsible && isCollapsed ? "opacity-0" : "opacity-100",
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
                "hover:bg-accent/20",
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
