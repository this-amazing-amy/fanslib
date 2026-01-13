import { MoreVertical, Send } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";

type ShootDetailDotsMenuProps = {
  onCreatePost: () => void;
  mediaCount: number;
};

export const ShootDetailDotsMenu = ({ onCreatePost, mediaCount }: ShootDetailDotsMenuProps) => {
  const handleAction = (actionId: string) => {
    if (actionId === "create-post") {
      onCreatePost();
    }
  };

  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        size="icon"
        className="bg-base-100 text-base-content hover:bg-base-200"
      >
        <MoreVertical className="h-5 w-5" />
      </Button>
      <DropdownMenuPopover placement="bottom end" className="w-56">
        <DropdownMenu onAction={handleAction}>
          <DropdownMenuItem
            id="create-post"
            isDisabled={mediaCount === 0}
            className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <Send className="h-4 w-4 shrink-0" />
            Create post with all media
          </DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};
