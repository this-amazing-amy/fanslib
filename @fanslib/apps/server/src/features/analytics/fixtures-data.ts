export type FanslyAnalyticsDatapointFixture = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

export type FanslyAnalyticsFixtureRow = {
  postId: string;
  mediaId: string;
  aggregate: {
    totalViews: number;
    averageEngagementPercent: number;
    averageEngagementSeconds: number;
    plateauDetectedAt: Date | null;
    nextFetchAt?: Date | null;
  };
  datapoints?: FanslyAnalyticsDatapointFixture[];
};

const fixtureChartBaseMs = 1_700_000_000_000;
const dayMs = 24 * 60 * 60 * 1000;

export const FANSLY_ANALYTICS_FIXTURES: FanslyAnalyticsFixtureRow[] = [
  {
    postId: "post-fansly-fyp-demo",
    mediaId: "media-1",
    aggregate: {
      totalViews: 10_000,
      averageEngagementPercent: 12.5,
      averageEngagementSeconds: 45,
      plateauDetectedAt: null,
    },
    datapoints: [0, 50, 80, 95, 100].map((views, i) => ({
      timestamp: fixtureChartBaseMs + i * dayMs,
      views,
      interactionTime: views * 1000,
    })),
  },
  {
    postId: "post-fansly-repost-a",
    mediaId: "media-5",
    aggregate: {
      totalViews: 8_200,
      averageEngagementPercent: 12.0,
      averageEngagementSeconds: 40,
      plateauDetectedAt: new Date("2024-07-15T12:00:00.000Z"),
    },
  },
  {
    postId: "post-fansly-repost-b",
    mediaId: "media-5",
    aggregate: {
      totalViews: 9_500,
      averageEngagementPercent: 12.5,
      averageEngagementSeconds: 42,
      plateauDetectedAt: new Date("2025-03-01T12:00:00.000Z"),
    },
  },
];
