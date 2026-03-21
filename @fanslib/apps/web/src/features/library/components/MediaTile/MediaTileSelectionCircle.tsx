import { useMediaSelectionStore } from "~/stores/mediaSelectionStore";
import { Check } from "lucide-react";
import { cn } from "~/lib/cn";

type MediaTileSelectionCircleProps = {
  mediaId: string;
  globalIndex: number;
};

export const MediaTileSelectionCircle = ({
  mediaId,
  globalIndex,
}: MediaTileSelectionCircleProps) => {
  const isSelected = useMediaSelectionStore((s) => s.selectedIds.has(mediaId));
  const toggleItem = useMediaSelectionStore((s) => s.toggleItem);

  return (
    <div
      className={cn(
        "selection-circle absolute top-2 right-2 w-5 h-5 rounded-full",
        "transition-opacity duration-200",
        "flex items-center justify-center",
        "border-2 cursor-pointer",
        "hover:opacity-100 group-hover:opacity-100",
        {
          "opacity-100 bg-primary border-primary text-primary-foreground": isSelected,
          "opacity-0 bg-background/80 border-foreground/20 hover:border-foreground/40": !isSelected,
        },
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleItem(mediaId, globalIndex);
      }}
    >
      {isSelected && <Check className="w-3 h-3" />}
    </div>
  );
};
