import type { LibraryScanProgress, LibraryScanResult } from '@fanslib/server/schemas';
import { useEffect, useState } from "react";
import { api } from "~/lib/api/hono-client";

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
      const statusResponse = await api.api.media.scan.status.$get();
      const status = await statusResponse.json();

      if (!status) return;

      if ('isScanning' in status && status.isScanning && status.progress) {
        setScanProgress(status.progress);
      }

      if ('isScanning' in status && !status.isScanning && status.result) {
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
    await api.api.media.scan.$post();
  };

  return {
    scanProgress,
    scanResult,
    isScanning: scanProgress !== null,
    handleScan,
    resetScan,
  };
};
