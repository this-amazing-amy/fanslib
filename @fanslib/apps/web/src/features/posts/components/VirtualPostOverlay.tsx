import { Plus } from "lucide-react";
import { cn } from "~/lib/cn";

type VirtualPostOverlayProps = {
  onClick: () => void;
  className?: string;
};

export const VirtualPostOverlay = ({ onClick, className }: VirtualPostOverlayProps) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2",
        "bg-primary/10 backdrop-blur-[2px] rounded-xl",
        "opacity-0 group-hover:opacity-100",
        "transition-all duration-200",
        "cursor-pointer z-10",
        className
      )}
    >
      <div className="flex flex-col items-center gap-1.5 text-primary">
        <Plus className="w-8 h-8 stroke-[2.5]" />
        <span className="text-sm font-semibold">Create</span>
      </div>
    </button>
  );
};
