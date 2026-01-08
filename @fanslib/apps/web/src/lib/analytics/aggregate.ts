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
};

export const aggregateDatapoints = (
  datapoints: RawDatapoint[],
  postDate: string
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

  const datapointsByDay = new Map<string, { views: number; timestamp: number }>();
  let cumulativeViews = 0;

  sortedDatapoints.forEach((datapoint) => {
    cumulativeViews += datapoint.views;

    const datapointDate = new Date(datapoint.timestamp);
    datapointDate.setHours(0, 0, 0, 0);

    const dateKey = datapointDate.toISOString().split("T")[0] ?? "";

    const existing = datapointsByDay.get(dateKey);
    if (existing) {
      existing.views = cumulativeViews;
    } else {
      datapointsByDay.set(dateKey, {
        views: cumulativeViews,
        timestamp: datapoint.timestamp,
      });
    }
  });

  const result: AggregatedDataPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  const allDateKeys: string[] = [];
  const lastDatapointDate = new Date(
    sortedDatapoints[sortedDatapoints.length - 1]?.timestamp ?? 0
  );
  lastDatapointDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(Math.min(lastDatapointDate.getTime(), today.getTime()));

  for (
    let currentDate = new Date(postDateObj);
    currentDate <= endDate;
    currentDate = new Date(currentDate.getTime() + dayMs)
  ) {
    allDateKeys.push(currentDate.toISOString().split("T")[0] ?? "");
  }

  allDateKeys.forEach((dateKey) => {
    const currentDate = new Date(dateKey + "T00:00:00Z");
    const daysSincePost = Math.floor(
      (currentDate.getTime() - postDateObj.getTime()) / dayMs
    );

    if (datapointsByDay.has(dateKey)) {
      const data = datapointsByDay.get(dateKey);
      result.push({
        date: formatter.format(currentDate),
        daysSincePost,
        views: data?.views ?? 0,
        timestamp: data?.timestamp ?? currentDate.getTime(),
      });
    } else {
      let prevViews = 0;
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i]) {
          prevViews = result[i]?.views ?? 0;
          break;
        }
      }

      result.push({
        date: formatter.format(currentDate),
        daysSincePost,
        views: prevViews,
        timestamp: currentDate.getTime(),
      });
    }
  });

  return result;
};

