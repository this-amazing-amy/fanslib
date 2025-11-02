import type { FanslyAnalyticsResponse } from "../../../../lib/fansly-analytics/fansly-analytics-response";
import type { FanslyAnalyticsDatapoint } from "../../entity";

type CreateFanslyAnalyticsDatapointPayload = Omit<
  FanslyAnalyticsDatapoint,
  "id" | "post" | "postId"
>;

export const gatherFanslyPostAnalyticsDatapoints = (
  response: FanslyAnalyticsResponse
): CreateFanslyAnalyticsDatapointPayload[] =>
  response.response.dataset.datapoints.flatMap((datapoint) =>
    datapoint.stats.length === 0
      ? [{ timestamp: datapoint.timestamp, views: 0, interactionTime: 0 }]
      : datapoint.stats
          .filter((s) => s.type === 0)
          .map((s) => ({
            timestamp: datapoint.timestamp,
            views: s.views + s.previewViews,
            interactionTime: s.interactionTime + s.previewInteractionTime,
          }))
  );

