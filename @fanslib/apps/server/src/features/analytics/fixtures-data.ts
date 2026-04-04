import type { MediaFixture } from "../library/fixtures-data";
import type { PostFixture, PostMediaFixture } from "../posts/fixtures-data";

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

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const randomInRange = (seed: number, min: number, max: number) =>
  Math.round(min + seededRandom(seed) * (max - min));

const randomFloatInRange = (seed: number, min: number, max: number) =>
  Math.round((min + seededRandom(seed) * (max - min)) * 10) / 10;

const generateDatapoints = (
  seed: number,
  totalViews: number,
  averageEngagementSeconds: number,
): FanslyAnalyticsDatapointFixture[] =>
  Array.from({ length: 7 }, (_, i) => {
    const progress = (i + 1) / 7;
    const jitter = 0.8 + seededRandom(seed * 100 + i) * 0.4;
    const views = Math.round(totalViews * progress * jitter);
    const secondsNoise = 0.85 + seededRandom(seed * 200 + i) * 0.3;
    return {
      timestamp: fixtureChartBaseMs + i * dayMs,
      views,
      interactionTime: Math.round(views * averageEngagementSeconds * secondsNoise),
    };
  });

const DEMO_FYP_COUNT = 8;
const DEMO_REPOST_MEDIA_COUNT = 7;

const demoFypMedia: MediaFixture[] = Array.from({ length: DEMO_FYP_COUNT }, (_, i) => ({
  id: `demo-fyp-media-${i + 1}`,
  relativePath: `/demo/fyp/content-${i + 1}.${i % 3 === 0 ? "mp4" : "jpg"}`,
  type: (i % 3 === 0 ? "video" : "image") as "video" | "image",
  name: `fyp-content-${i + 1}.${i % 3 === 0 ? "mp4" : "jpg"}`,
  size: randomInRange(i + 100, 500_000, 30_000_000),
  duration: i % 3 === 0 ? randomInRange(i + 200, 15, 180) : null,
  excluded: false,
}));

const demoRepostMedia: MediaFixture[] = Array.from({ length: DEMO_REPOST_MEDIA_COUNT }, (_, i) => ({
  id: `demo-repost-media-${i + 1}`,
  relativePath: `/demo/repost/clip-${i + 1}.${i % 2 === 0 ? "jpg" : "mp4"}`,
  type: (i % 2 === 0 ? "image" : "video") as "image" | "video",
  name: `repost-clip-${i + 1}.${i % 2 === 0 ? "jpg" : "mp4"}`,
  size: randomInRange(i + 300, 800_000, 25_000_000),
  duration: i % 2 === 0 ? null : randomInRange(i + 400, 10, 120),
  excluded: false,
}));

const fypCaptions = [
  "New set just dropped",
  "POV you found my page",
  "This one's blowing up",
  "Can't believe the reach on this",
  "Late night content",
  "Golden hour vibes",
  "Your favorite creator",
  "Exclusive first look",
];

const repostCaptions = [
  "Throwback to this fan favorite",
  "One of my best performing posts",
  "Bringing this one back",
  "Still love how this turned out",
  "Classic content repost",
  "This deserves another round",
  "Revisiting an old favorite",
];

const demoFypPosts: PostFixture[] = demoFypMedia.map((m, i) => ({
  id: `demo-post-fyp-${i + 1}`,
  channelId: "channel-1",
  caption: fypCaptions[i % fypCaptions.length],
  status: "posted" as const,
  date: new Date(2025, 0 + Math.floor(i / 3), 5 + i * 3),
  subredditId: null,
}));

const demoRepostPosts: PostFixture[] = demoRepostMedia.flatMap((m, i) => {
  const postCount = i < 3 ? 2 : 1;
  return Array.from({ length: postCount }, (_, j) => ({
    id: `demo-post-repost-${i + 1}${j > 0 ? `-${j + 1}` : ""}`,
    channelId: "channel-1",
    caption: repostCaptions[(i + j) % repostCaptions.length],
    status: "posted" as const,
    date: new Date(2024, 2 + i, 10 + j * 45),
    subredditId: null,
  }));
});

const demoFypPostMedia: PostMediaFixture[] = demoFypPosts.map((p, i) => ({
  postId: p.id,
  mediaId: demoFypMedia[i].id,
  order: 0,
  isFreePreview: false,
  fanslyStatisticsId: `demo-fyp-stats-${i + 1}`,
}));

const demoRepostPostMedia: PostMediaFixture[] = demoRepostPosts.map((p, i) => {
  const mediaIndex = demoRepostMedia.findIndex((m) =>
    p.id.startsWith(`demo-post-repost-${demoRepostMedia.indexOf(m) + 1}`),
  );
  const resolvedIndex =
    mediaIndex >= 0
      ? mediaIndex
      : (() => {
          const match = p.id.match(/demo-post-repost-(\d+)/);
          return match ? parseInt(match[1], 10) - 1 : i % DEMO_REPOST_MEDIA_COUNT;
        })();
  return {
    postId: p.id,
    mediaId: demoRepostMedia[resolvedIndex].id,
    order: 0,
    isFreePreview: false,
    fanslyStatisticsId: `demo-repost-stats-${p.id}`,
  };
});

const demoFypAnalytics: FanslyAnalyticsFixtureRow[] = demoFypPosts.map((p, i) => {
  const totalViews = randomInRange(i + 500, 20, 1000);
  const averageEngagementPercent = randomFloatInRange(i + 600, 30, 65);
  const averageEngagementSeconds = randomFloatInRange(i + 700, 2, 6);
  return {
    postId: p.id,
    mediaId: demoFypMedia[i].id,
    aggregate: {
      totalViews,
      averageEngagementPercent,
      averageEngagementSeconds,
      plateauDetectedAt: null,
    },
    datapoints: generateDatapoints(i + 800, totalViews, averageEngagementSeconds),
  };
});

const demoRepostAnalytics: FanslyAnalyticsFixtureRow[] = demoRepostPosts.map((p, i) => {
  const resolvedIndex = (() => {
    const match = p.id.match(/demo-post-repost-(\d+)/);
    return match ? parseInt(match[1], 10) - 1 : i % DEMO_REPOST_MEDIA_COUNT;
  })();
  const totalViews = randomInRange(resolvedIndex * 10 + i + 900, 20, 1000);
  const averageEngagementSeconds = randomFloatInRange(i + 1100, 2, 6);
  const plateauMonth = 3 + resolvedIndex;
  return {
    postId: p.id,
    mediaId: demoRepostMedia[resolvedIndex].id,
    aggregate: {
      totalViews,
      averageEngagementPercent: randomFloatInRange(i + 1000, 30, 65),
      averageEngagementSeconds,
      plateauDetectedAt: new Date(2024, plateauMonth, 15),
    },
    datapoints: generateDatapoints(
      resolvedIndex * 100 + i + 1400,
      totalViews,
      averageEngagementSeconds,
    ),
  };
});

export const DEMO_MEDIA_FIXTURES: MediaFixture[] = [...demoFypMedia, ...demoRepostMedia];

export const DEMO_POST_FIXTURES: PostFixture[] = [...demoFypPosts, ...demoRepostPosts];

export const DEMO_POST_MEDIA_FIXTURES: PostMediaFixture[] = [
  ...demoFypPostMedia,
  ...demoRepostPostMedia,
];

const demoStaticFypViews = 640;
const demoStaticFypEngagementSeconds = 4.2;
const demoStaticFypPercent = 52.4;

export const FANSLY_ANALYTICS_FIXTURES: FanslyAnalyticsFixtureRow[] = [
  {
    postId: "post-fansly-fyp-demo",
    mediaId: "media-1",
    aggregate: {
      totalViews: demoStaticFypViews,
      averageEngagementPercent: demoStaticFypPercent,
      averageEngagementSeconds: demoStaticFypEngagementSeconds,
      plateauDetectedAt: null,
    },
    datapoints: [0.14, 0.32, 0.51, 0.74, 0.91, 0.97, 1].map((progress, i) => {
      const views = Math.round(demoStaticFypViews * progress);
      return {
        timestamp: fixtureChartBaseMs + i * dayMs,
        views,
        interactionTime: Math.round(views * demoStaticFypEngagementSeconds * (0.88 + i * 0.02)),
      };
    }),
  },
  {
    postId: "post-fansly-repost-a",
    mediaId: "media-5",
    aggregate: {
      totalViews: 412,
      averageEngagementPercent: 44.1,
      averageEngagementSeconds: 3.6,
      plateauDetectedAt: new Date("2024-07-15T12:00:00.000Z"),
    },
  },
  {
    postId: "post-fansly-repost-b",
    mediaId: "media-5",
    aggregate: {
      totalViews: 788,
      averageEngagementPercent: 38.7,
      averageEngagementSeconds: 5.1,
      plateauDetectedAt: new Date("2025-03-01T12:00:00.000Z"),
    },
  },
  ...demoFypAnalytics,
  ...demoRepostAnalytics,
];
