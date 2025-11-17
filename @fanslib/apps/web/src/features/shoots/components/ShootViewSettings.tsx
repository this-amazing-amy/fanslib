import { Settings2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuPopover,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";

export const ShootViewSettings = () => (
  <DropdownMenuTrigger>
    <Button variant="outline" size="icon">
      <Settings2 className="h-4 w-4" />
    </Button>
    <DropdownMenuPopover placement="bottom end" className="w-56">
      <DropdownMenu>
        <DropdownMenuLabel>View Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="flex items-center justify-between"></div>
        </div>
      </DropdownMenu>
    </DropdownMenuPopover>
  </DropdownMenuTrigger>
);
