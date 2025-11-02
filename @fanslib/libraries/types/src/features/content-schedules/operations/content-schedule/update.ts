import type { MediaFilters } from "../../../library/types";
import type { ContentSchedule } from "../../content-schedule";

export type UpdateContentScheduleRequest = {
  type?: "daily" | "weekly" | "monthly";
  postsPerTimeframe?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  mediaFilters?: MediaFilters | null;
};

export type UpdateContentScheduleResponse = ContentSchedule | null;

