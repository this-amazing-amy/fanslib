import type { ReactNode } from "react";

export type Datapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

export type AnalyticsPostCardProps = {
  postId?: string;
  mediaId: string;
  caption: string | null;
  totalViews: number;
  averageEngagementPercent: number;
  averageEngagementSeconds: number;
  datapoints?: Datapoint[];
  sortMetric?: "views" | "engagementPercent" | "engagementSeconds";
  timesPosted?: number;
  actionSlot?: ReactNode;
  /** When true, hides the inline sparkline. Expanded growth chart still works when `postId` and datapoints allow. */
  compact?: boolean;
};
