import type { LibraryScanProgress, LibraryScanResult } from '@fanslib/server/schemas';
import { Progress } from "~/components/ui/Progress";

type ScanProgressProps = {
  scanProgress: LibraryScanProgress | null;
  scanResult: LibraryScanResult | null;
};

export const ScanProgress = ({ scanProgress, scanResult }: ScanProgressProps) => {
  if (!scanProgress && !scanResult) return null;

  return (
    <>
      {scanProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Scanning library...</span>
            <span>{Math.round((scanProgress.current / scanProgress.total) * 100)}%</span>
          </div>
          <Progress value={(scanProgress.current / scanProgress.total) * 100} />
        </div>
      )}

      {scanResult && (
        <div className="mb-4 text-sm text-muted-foreground">
          Scan complete: {scanResult.added} added, {scanResult.updated} updated,{" "}
          {scanResult.removed} removed
        </div>
      )}
    </>
  );
};
