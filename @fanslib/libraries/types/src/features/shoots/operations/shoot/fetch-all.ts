import type { PaginatedResponse } from "../../../../common/pagination";
import type { ShootFilter, ShootSummary } from "../../shoot";

export type FetchAllShootsRequest = {
  page?: number;
  limit?: number;
  filter?: ShootFilter;
};

export type FetchAllShootsResponse = PaginatedResponse<ShootSummary>;
