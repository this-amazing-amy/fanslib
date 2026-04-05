import {
  Crop,
  Droplets,
  Grid3x3,
  Image as ImageIcon,
  Smile,
  Type,
  ZoomIn,
} from "lucide-react";

type OperationBlockProps = {
  id: string;
  type: string;
  label?: string;
  startFrame: number;
  endFrame: number;
  pixelsPerFrame: number;
  selected: boolean;
  onClick: () => void;
};

const typeConfig: Record<
  string,
  { bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  caption: { bg: "bg-primary/30 border-primary", icon: Type },
  blur: { bg: "bg-secondary/30 border-secondary", icon: Droplets },
  crop: { bg: "bg-accent/30 border-accent", icon: Crop },
  watermark: { bg: "bg-info/30 border-info", icon: ImageIcon },
  emoji: { bg: "bg-success/30 border-success", icon: Smile },
  pixelate: { bg: "bg-warning/30 border-warning", icon: Grid3x3 },
  zoom: { bg: "bg-neutral/30 border-neutral", icon: ZoomIn },
};

export const OperationBlock = ({
  id,
  type,
  label,
  startFrame,
  endFrame,
  pixelsPerFrame,
  selected,
  onClick,
}: OperationBlockProps) => {
  const config = typeConfig[type] ?? {
    bg: "bg-base-300 border-base-content",
    icon: Type,
  };
  const Icon = config.icon;
  const width = (endFrame - startFrame) * pixelsPerFrame;
  const left = startFrame * pixelsPerFrame;

  return (
    <div
      data-testid={`operation-block-${id}`}
      className={`absolute h-8 rounded-sm border cursor-pointer overflow-hidden whitespace-nowrap text-xs flex items-center gap-1 px-1 ${config.bg}${selected ? " ring-2 ring-base-content" : ""}`}
      style={{ width: `${width}px`, left: `${left}px` }}
      onClick={onClick}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="shrink-0">{type}</span>
      {type === "caption" && label && (
        <span className="truncate opacity-70">{label}</span>
      )}
    </div>
  );
};
