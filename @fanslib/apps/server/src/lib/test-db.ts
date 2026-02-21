// @ts-expect-error — sql.js has no type declarations
import initSqlJs from "sql.js";
import { DataSource } from "typeorm";
import { FanslyMediaCandidate } from "../features/analytics/candidate-entity";
import {
  AnalyticsFetchHistory,
  FanslyAnalyticsAggregate,
  FanslyAnalyticsDatapoint,
} from "../features/analytics/entity";
import { Channel, ChannelType } from "../features/channels/entity";
import { ContentSchedule, ScheduleChannel, SkippedScheduleSlot } from "../features/content-schedules/entity";
import { FilterPreset } from "../features/filter-presets/entity";
import { Hashtag, HashtagChannelStats } from "../features/hashtags/entity";
import { Media } from "../features/library/entity";
import { Post, PostMedia } from "../features/posts/entity";
import { Shoot } from "../features/shoots/entity";
import { CaptionSnippet } from "../features/snippets/entity";
import { Subreddit } from "../features/subreddits/entity";
import { MediaTag, TagDefinition, TagDimension } from "../features/tags/entity";
import { setTestDataSource } from "./db";

// eslint-disable-next-line functional/no-let
let testDataSource: DataSource | null = null;

// eslint-disable-next-line functional/no-let
let _sqlJsDriver: Awaited<ReturnType<typeof initSqlJs>> | null = null;

const loadTestSqlJs = async () => {
  if (_sqlJsDriver) return _sqlJsDriver;
  _sqlJsDriver = await initSqlJs();
  return _sqlJsDriver;
};

export const createTestDataSource = (driver?: Awaited<ReturnType<typeof initSqlJs>>) => new DataSource({
  type: "sqljs",
  ...(driver ? { driver } : {}),
  entities: [
    Media,
    Post,
    PostMedia,
    Channel,
    ChannelType,
    Subreddit,
    TagDimension,
    TagDefinition,
    MediaTag,
    Hashtag,
    HashtagChannelStats,
    Shoot,
    ContentSchedule,
    ScheduleChannel,
    SkippedScheduleSlot,
    FilterPreset,
    CaptionSnippet,
    FanslyAnalyticsDatapoint,
    FanslyAnalyticsAggregate,
    AnalyticsFetchHistory,
    FanslyMediaCandidate,
  ],
  synchronize: true,
  logging: false,
  dropSchema: false,
});

export const setupTestDatabase = async () => {
  if (testDataSource?.isInitialized) {
    return testDataSource;
  }

  const driver = await loadTestSqlJs();
  testDataSource = createTestDataSource(driver);
  await testDataSource.initialize();
  setTestDataSource(testDataSource);
  return testDataSource;
};

export const teardownTestDatabase = async () => {
  if (testDataSource?.isInitialized) {
    setTestDataSource(null);
    await testDataSource.destroy();
    testDataSource = null;
  }
};

export const getTestDataSource = () => {
  if (!testDataSource) {
    throw new Error("Test database not initialized. Call setupTestDatabase() first.");
  }
  return testDataSource;
};

export const clearAllTables = async () => {
  const dataSource = getTestDataSource();

  const clearIfEntityExists = async (entityName: string) => {
    const hasEntity = dataSource.entityMetadatas.some(
      (metadata) => metadata.name === entityName || metadata.tableName === entityName
    );
    if (!hasEntity) return;
    await dataSource.getRepository(entityName).clear();
  };

  const entityClearOrder = [
    "FanslyQueueItem",
    "FanslyMediaCandidate",
    "PostMedia",
    "Post",
    "HashtagChannelStats",
    "MediaTag",
    "ScheduleChannel",
    "ContentSchedule",
    "CaptionSnippet",
    "Subreddit",
    "Channel",
    "Shoot",
    "TagDefinition",
    "TagDimension",
    "Media",
    "Hashtag",
    "ChannelType",
    "FilterPreset",
    "FanslyAnalyticsDatapoint",
    "FanslyAnalyticsAggregate",
    "AnalyticsFetchHistory",
  ];

  await entityClearOrder.reduce(
    (promise, entityName) => promise.then(() => clearIfEntityExists(entityName)),
    Promise.resolve()
  );
};

