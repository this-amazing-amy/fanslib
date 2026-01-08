import { t } from "elysia";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyAnalyticsDatapoint } from "../../entity";

export const FetchDatapointsRequestParamsSchema = t.Object({
  postMediaId: t.String(),
});

export const FetchDatapointsResponseSchema = t.Object({
  datapoints: t.Array(
    t.Object({
      timestamp: t.Number(),
      views: t.Number(),
      interactionTime: t.Number(),
    })
  ),
  lastDatapointDate: t.Union([t.Number(), t.Null()]),
  hasGap: t.Boolean(),
  suggestedFetchRange: t.Union([
    t.Object({
      startDate: t.String(),
      endDate: t.String(),
    }),
    t.Null(),
  ]),
  postDate: t.String(),
});

export const fetchDatapoints = async (
  postMediaId: string
): Promise<typeof FetchDatapointsResponseSchema.static> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);
  const datapointRepository = dataSource.getRepository(FanslyAnalyticsDatapoint);

  const postMedia = await postMediaRepository.findOne({
    where: { id: postMediaId },
    relations: { post: true },
  });

  if (!postMedia) {
    throw new Error("PostMedia not found");
  }

  const datapoints = await datapointRepository.find({
    where: { postMediaId },
    order: { timestamp: "ASC" },
  });

  const postDate = new Date(postMedia.post.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDatapointTimestamp =
    datapoints.length > 0 ? datapoints[datapoints.length - 1]?.timestamp ?? null : null;
  const lastDatapointDate = lastDatapointTimestamp
    ? new Date(lastDatapointTimestamp)
    : null;

  if (lastDatapointDate) {
    lastDatapointDate.setHours(0, 0, 0, 0);
  }

  const gapThresholdMs = 24 * 60 * 60 * 1000;
  const hasGap =
    lastDatapointDate !== null &&
    today.getTime() - lastDatapointDate.getTime() > gapThresholdMs;

  const suggestedFetchRange = hasGap && lastDatapointDate
    ? {
        startDate: new Date(lastDatapointDate.getTime() + gapThresholdMs).toISOString(),
        endDate: today.toISOString(),
      }
    : null;

  return {
    datapoints: datapoints.map((dp) => ({
      timestamp: dp.timestamp,
      views: dp.views,
      interactionTime: dp.interactionTime,
    })),
    lastDatapointDate: lastDatapointTimestamp,
    hasGap,
    suggestedFetchRange,
    postDate: postMedia.post.date,
  };
};

