import { MoreVertical, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/Button/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/cn";

type ScanButtonProps = {
  isScanning: boolean;
  onScan: () => Promise<void>;
};

export const ScanButton = ({ isScanning, onScan }: ScanButtonProps) => (
    <DropdownMenu>
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        size="icon"
        isDisabled={isScanning}
        className="border border-base-300/40 bg-base-100 text-base-content shadow-sm hover:border-base-300/60 hover:bg-base-200"
      >
        <MoreVertical className="h-5 w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem
        onClick={onScan}
        disabled={isScanning}
        className="flex items-center gap-2 text-sm font-medium"
      >
        <RefreshCw className={cn("h-4 w-4", isScanning && "animate-spin")} />
        {isScanning ? "Scanning..." : "Scan Library"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
