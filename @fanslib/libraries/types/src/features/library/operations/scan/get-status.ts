import type { LibraryScanProgress, LibraryScanResult } from "../../media";

export type GetScanStatusRequest = Record<string, never>;

export type GetScanStatusResponse = {
  isScanning: boolean;
  progress?: LibraryScanProgress;
  result?: LibraryScanResult;
};
