import { MoreVertical, RefreshCw } from "lucide-react";
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
      <button
        disabled={isScanning}
        className={cn(
          "btn btn-ghost hover:bg-primary/20 hover:ring-2 hover:ring-primary btn-square bg-base-100 text-base-content hover:bg-base-200",
          isScanning && "opacity-50 cursor-not-allowed"
        )}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
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
