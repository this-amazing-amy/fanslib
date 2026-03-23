import { GripVertical } from "lucide-react";
import React, { useContext, useState, type ReactNode } from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/cn";
import { ResizableContext } from "./ResizableContext";

export const ResizableHandle = ({
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
          "relative flex w-3 h-full cursor-col-resize items-center justify-center rounded-full bg-primary/30 transition-colors hover:bg-primary/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
          className,
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
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {collapseButton}
        </div>
      )}
    </div>
  );
};
