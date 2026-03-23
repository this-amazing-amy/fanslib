import React, { createContext, useEffect, useState } from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/cn";
import { saveLayoutToLocalStorage } from "./layout-persistence";

export type ResizableContextType = {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

export const ResizableContext = createContext<ResizableContextType>({
  isDragging: false,
  setIsDragging: () => undefined,
});

type ResizablePanelGroupProps = React.ComponentProps<typeof ResizablePrimitive.PanelGroup> & {
  id: string;
};

export const ResizablePanelGroup = ({ className, id, ...props }: ResizablePanelGroupProps) => {
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
          className,
        )}
        {...props}
      />
    </ResizableContext.Provider>
  );
};
