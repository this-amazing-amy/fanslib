import { GripVertical } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type ResizableProps = {
  children: ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
};

export const Resizable = ({
  children,
  className = '',
  direction = 'horizontal',
}: ResizableProps) => {
  return (
    <div
      className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'} h-full w-full ${className}`}
    >
      {children}
    </div>
  );
};

type ResizablePanelProps = {
  children: ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
};

export const ResizablePanel = ({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className = '',
}: ResizablePanelProps) => {
  const [size, setSize] = useState(defaultSize);

  return (
    <div
      className={`relative flex flex-col ${className}`}
      style={{ flex: `0 0 ${size}%` }}
    >
      {children}
    </div>
  );
};

type ResizableHandleProps = {
  className?: string;
  withHandle?: boolean;
  onResize?: (delta: number) => void;
};

export const ResizableHandle = ({
  className = '',
  withHandle = false,
}: ResizableHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center bg-border hover:bg-border/80 transition-colors ${isDragging ? 'bg-primary' : ''} ${className}`}
      style={{ 
        width: withHandle ? '4px' : '1px',
        cursor: 'col-resize',
        userSelect: 'none',
      }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
};

