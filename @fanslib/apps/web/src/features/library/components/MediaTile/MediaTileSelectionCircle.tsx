import { useMediaSelection } from "~/contexts/MediaSelectionContext";
import { Check } from "lucide-react";
import { cn } from "~/lib/cn";

type MediaTileSelectionCircleProps = {
  mediaId: string;
};

export const MediaTileSelectionCircle = ({ mediaId }: MediaTileSelectionCircleProps) => {
  const { isSelected, toggleMediaSelection } = useMediaSelection();

  return (
    <div
      className={cn(
        "selection-circle absolute top-2 right-2 w-5 h-5 rounded-full",
        "transition-opacity duration-200",
        "flex items-center justify-center",
        "border-2 cursor-pointer",
        "hover:opacity-100 group-hover:opacity-100",
        {
          "opacity-100 bg-primary border-primary text-primary-foreground": isSelected(mediaId),
          "opacity-0 bg-background/80 border-foreground/20 hover:border-foreground/40":
            !isSelected(mediaId),
        }
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleMediaSelection(mediaId, e);
      }}
    >
      {isSelected(mediaId) && <Check className="w-3 h-3" />}
    </div>
  );
};
