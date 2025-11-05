import type { LibraryScanProgress, LibraryScanResult } from "@fanslib/types";
import { useEffect, useState } from "react";
import { mediaApi } from "~/lib/api/media";

type UseScanResult = {
  scanProgress: LibraryScanProgress | null;
  scanResult: LibraryScanResult | null;
  isScanning: boolean;
  handleScan: () => Promise<void>;
  resetScan: () => void;
};

export const useScan = (onScanComplete?: () => void): UseScanResult => {
  const [scanProgress, setScanProgress] = useState<LibraryScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<LibraryScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isScanning) return () => {};

    const pollInterval = setInterval(async () => {
      const status = await mediaApi.getScanStatus();

      if (status.progress) {
        setScanProgress(status.progress);
      }

      if (status.result) {
        setScanProgress(null);
        setScanResult(status.result);
        setIsScanning(false);
        onScanComplete?.();
      }
    }, 500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isScanning, onScanComplete]);

  const resetScan = () => {
    setScanProgress(null);
    setScanResult(null);
    setIsScanning(false);
  };

  const handleScan = async () => {
    resetScan();
    setIsScanning(true);
    await mediaApi.scan();
  };

  return {
    scanProgress,
    scanResult,
    isScanning: scanProgress !== null,
    handleScan,
    resetScan,
  };
};
