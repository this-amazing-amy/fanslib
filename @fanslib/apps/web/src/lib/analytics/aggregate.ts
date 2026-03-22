type RawDatapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

export type AggregatedDataPoint = {
  date: string;
  daysSincePost: number;
  views: number;
  timestamp: number;
  interactionTime: number;
};

export const aggregateDatapoints = (
  datapoints: RawDatapoint[],
  postDate: string,
): AggregatedDataPoint[] => {
  if (datapoints.length === 0) {
    return [];
  }

  const postDateObj = new Date(postDate);
  postDateObj.setHours(0, 0, 0, 0);

  const sortedDatapoints = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const datapointsByDay = sortedDatapoints.reduce(
    (acc, datapoint) => {
      const cumulativeViews = acc.cumulativeViews + datapoint.views;
      const cumulativeInteractionTime = acc.cumulativeInteractionTime + datapoint.interactionTime;
      const datapointDate = new Date(datapoint.timestamp);
      datapointDate.setHours(0, 0, 0, 0);
      const dateKey = datapointDate.toISOString().split("T")[0] ?? "";
      const nextMap = new Map(acc.byDay);
      nextMap.set(dateKey, {
        views: cumulativeViews,
        interactionTime: cumulativeInteractionTime,
        timestamp: datapoint.timestamp,
      });

      return { cumulativeViews, cumulativeInteractionTime, byDay: nextMap };
    },
    {
      cumulativeViews: 0,
      cumulativeInteractionTime: 0,
      byDay: new Map<string, { views: number; interactionTime: number; timestamp: number }>(),
    },
  ).byDay;
  const dayMs = 24 * 60 * 60 * 1000;

  const lastDatapointDate = new Date(sortedDatapoints[sortedDatapoints.length - 1]?.timestamp ?? 0);
  lastDatapointDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(Math.min(lastDatapointDate.getTime(), today.getTime()));
  const totalDays = Math.max(0, Math.floor((endDate.getTime() - postDateObj.getTime()) / dayMs));

  const allDateKeys = Array.from(
    { length: totalDays + 1 },
    (_, index) => new Date(postDateObj.getTime() + index * dayMs).toISOString().split("T")[0] ?? "",
  );

  const aggregated = allDateKeys.reduce(
    (acc, dateKey) => {
      const currentDate = new Date(`${dateKey}T00:00:00Z`);
      const daysSincePost = Math.floor((currentDate.getTime() - postDateObj.getTime()) / dayMs);
      const data = datapointsByDay.get(dateKey);
      const views = data?.views ?? acc.prevViews;
      const interactionTime = data?.interactionTime ?? acc.prevInteractionTime;
      const nextPoint: AggregatedDataPoint = {
        date: formatter.format(currentDate),
        daysSincePost,
        views,
        interactionTime,
        timestamp: data?.timestamp ?? currentDate.getTime(),
      };

      return {
        prevViews: views,
        prevInteractionTime: interactionTime,
        result: [...acc.result, nextPoint],
      };
    },
    { prevViews: 0, prevInteractionTime: 0, result: [] as AggregatedDataPoint[] },
  );

  return aggregated.result;
};
