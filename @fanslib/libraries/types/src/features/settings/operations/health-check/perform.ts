import type { HealthCheckResult } from "../../settings";

export type PerformHealthCheckRequest = {
  serverUrl: string;
};

export type PerformHealthCheckResponse = HealthCheckResult;

