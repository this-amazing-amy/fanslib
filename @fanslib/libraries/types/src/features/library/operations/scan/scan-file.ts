import type { FileScanResult } from "../../media";

export type ScanFileRequest = {
  filePath: string;
};

export type ScanFileResponse = FileScanResult;
