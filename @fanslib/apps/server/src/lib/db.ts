import { existsSync } from "fs";
import { mkdir, unlink } from "fs/promises";
import { dirname } from "path";
import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  AnalyticsFetchHistory,
  FanslyAnalyticsAggregate,
  FanslyAnalyticsDatapoint,
} from "../features/analytics/entity";
import { Channel, ChannelType } from "../features/channels/entity";
import { ContentSchedule } from "../features/content-schedules/entity";
import { FilterPreset } from "../features/filter-presets/entity";
import { Hashtag, HashtagChannelStats } from "../features/hashtags/entity";
import { Media } from "../features/library/entity";
import { Post, PostMedia } from "../features/posts/entity";
import { Shoot } from "../features/shoots/entity";
import { CaptionSnippet } from "../features/snippets/entity";
import { Subreddit } from "../features/subreddits/entity";
import { MediaTag, TagDefinition, TagDimension } from "../features/tags/entity";

const dbPath = process.env.SQLITE_DB_PATH ?? "./data/fanslib.sqlite";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
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
    FilterPreset,
    CaptionSnippet,
    FanslyAnalyticsDatapoint,
    FanslyAnalyticsAggregate,
    AnalyticsFetchHistory,
    // Additional entities will be added as features are migrated
  ],
  synchronize: true,
  logging: false,
});

// eslint-disable-next-line functional/no-let
let initialized = false;
// eslint-disable-next-line functional/no-let
let testDataSource: DataSource | null = null;

export const setTestDataSource = (dataSource: DataSource | null) => {
  testDataSource = dataSource;
};

export const uninitialize = async () => {
  if (initialized) {
    await AppDataSource.destroy();
    initialized = false;
  }
};

export const db = async () => {
  if (testDataSource) {
    return testDataSource;
  }
  
  if (!initialized) {
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      await mkdir(dbDir, { recursive: true });
    }
    
    await AppDataSource.initialize();
    initialized = true;
  }

  return AppDataSource;
};

export const resetDatabase = async (): Promise<void> => {
  console.log("🗑️ Resetting database...");
  try {
    const dataSource = await db();
    await dataSource.destroy();
    initialized = false;

    if (existsSync(dbPath)) {
      await unlink(dbPath);
    }

    await db();
    console.log("✅ Database reset successfully");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
};

