import { MoreVertical, RefreshCw, Upload } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/cn";

type ScanButtonProps = {
  isScanning: boolean;
  onScan: () => Promise<void>;
  onUpload: () => void;
};

export const ScanButton = ({ isScanning, onScan, onUpload }: ScanButtonProps) => (
  <DropdownMenuTrigger>
    <Button
      isDisabled={isScanning}
      size="icon"
      variant="ghost"
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
    <DropdownMenuPopover placement="bottom end" className="w-48">
      <DropdownMenu onAction={(key) => {
        if (key === "scan") onScan();
        if (key === "upload") onUpload();
      }}>
        <DropdownMenuItem
          id="upload"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </DropdownMenuItem>
        <DropdownMenuItem
          id="scan"
          isDisabled={isScanning}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={cn("h-4 w-4", isScanning && "animate-spin")} />
          {isScanning ? "Scanning..." : "Scan Library"}
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuPopover>
  </DropdownMenuTrigger>
);
