import { DataSource } from "typeorm";
import {
  AnalyticsFetchHistory,
  FanslyAnalyticsAggregate,
  FanslyAnalyticsDatapoint,
} from "../features/analytics/entity";
import { Channel, ChannelType } from "../features/channels/entity";
import { ContentSchedule, SkippedScheduleSlot } from "../features/content-schedules/entity";
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

export const createTestDataSource = () => new DataSource({
    type: "sqlite",
    database: ":memory:",
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
      SkippedScheduleSlot,
      FilterPreset,
      CaptionSnippet,
      FanslyAnalyticsDatapoint,
      FanslyAnalyticsAggregate,
      AnalyticsFetchHistory,
    ],
    synchronize: true,
    logging: false,
    dropSchema: false,
  });

export const setupTestDatabase = async () => {
  if (testDataSource?.isInitialized) {
    return testDataSource;
  }

  testDataSource = createTestDataSource();
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
  
  await dataSource.getRepository("FanslyQueueItem").clear();
  await dataSource.getRepository("PostMedia").clear();
  await dataSource.getRepository("Post").clear();
  await dataSource.getRepository("HashtagChannelStats").clear();
  await dataSource.getRepository("MediaTag").clear();
  await dataSource.getRepository("ContentSchedule").clear();
  await dataSource.getRepository("CaptionSnippet").clear();
  await dataSource.getRepository("Channel").clear();
  await dataSource.getRepository("Shoot").clear();
  await dataSource.getRepository("Subreddit").clear();
  await dataSource.getRepository("TagDefinition").clear();
  await dataSource.getRepository("TagDimension").clear();
  await dataSource.getRepository("Media").clear();
  await dataSource.getRepository("Hashtag").clear();
  await dataSource.getRepository("ChannelType").clear();
  await dataSource.getRepository("FilterPreset").clear();
  await dataSource.getRepository("FanslyAnalyticsDatapoint").clear();
  await dataSource.getRepository("FanslyAnalyticsAggregate").clear();
  await dataSource.getRepository("AnalyticsFetchHistory").clear();
};

export const resetAllFixtures = async () => {
  await clearAllTables();
  const { seedAllFixtures } = await import("./fixtures");
  return seedAllFixtures();
};

