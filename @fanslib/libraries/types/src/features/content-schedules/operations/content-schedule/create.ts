import type { MediaFilters } from "../../../library/types";
import type { ContentSchedule } from "../../content-schedule";

export type CreateContentScheduleRequest = {
  channelId: string;
  type: "daily" | "weekly" | "monthly";
  postsPerTimeframe?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  mediaFilters?: MediaFilters;
};

export type CreateContentScheduleResponse = ContentSchedule;

