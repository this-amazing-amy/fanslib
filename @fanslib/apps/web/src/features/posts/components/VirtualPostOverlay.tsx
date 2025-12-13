import { Plus } from "lucide-react";
import { cn } from "~/lib/cn";

type VirtualPostOverlayProps = {
  onClick: () => void;
  className?: string;
};

export const VirtualPostOverlay = ({ onClick, className }: VirtualPostOverlayProps) => <button
      type="button"
      aria-label="Create"
      title="Create"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-base-100/60 backdrop-blur-[2px] rounded-lg ring-1 ring-primary/20",
        "opacity-0 group-hover:opacity-100",
        "transition-all duration-200",
        "cursor-pointer z-10",
        className
      )}
    >
      <div className="flex items-center justify-center rounded-xl bg-primary p-3 text-primary-content cursor-pointer">
        <Plus className="h-10 w-10 stroke-[2.75]" />
      </div>
    </button>;
