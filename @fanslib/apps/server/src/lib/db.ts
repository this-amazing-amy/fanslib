import { existsSync, readFileSync } from "fs";
import { mkdir, unlink } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import "reflect-metadata";
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
import { sqliteDbPath } from "./env";

// Resolve WASM path: env var > next to built bundle > node_modules fallback
const resolveWasmPath = (): string => {
  if (process.env.SQL_WASM_PATH) return process.env.SQL_WASM_PATH;

  // When running from bundled dist/, the WASM file should be next to the script
  const scriptDir = typeof import.meta.url === 'string'
    ? dirname(fileURLToPath(import.meta.url))
    : __dirname;
  const bundledPath = join(scriptDir, 'sql-wasm.wasm');
  if (existsSync(bundledPath)) return bundledPath;

  // Fallback: resolve from node_modules (development)
  try {
    const resolved = require.resolve('sql.js/dist/sql-wasm.wasm');
    if (existsSync(resolved)) return resolved;
  } catch { /* ignore */ }

  throw new Error(
    'sql-wasm.wasm not found. Set SQL_WASM_PATH or place it next to the server bundle.'
  );
};

// Pre-initialize sql.js with explicit WASM binary to avoid hardcoded paths
// eslint-disable-next-line functional/no-let
let _sqlJsDriver: Awaited<ReturnType<typeof initSqlJs>> | null = null;

const loadSqlJsDriver = async () => {
  if (_sqlJsDriver) return _sqlJsDriver;
  const wasmPath = resolveWasmPath();
  const wasmBinary = readFileSync(wasmPath);
  _sqlJsDriver = await initSqlJs({ wasmBinary });
  return _sqlJsDriver;
};

// Lazy initialization to avoid requiring env vars during test setup
// eslint-disable-next-line functional/no-let
let _dbPath: string | null = null;
// eslint-disable-next-line functional/no-let
let _appDataSource: DataSource | null = null;

const getDbPath = () => {
  _dbPath ??= sqliteDbPath();
  return _dbPath;
};

const createAppDataSource = (driver?: Awaited<ReturnType<typeof initSqlJs>>) => {
  _appDataSource ??= new DataSource({
    type: "sqljs",
    location: getDbPath(),
    autoSave: true,
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
  });
  return _appDataSource;
};

export const AppDataSource = new Proxy({} as DataSource, {
  get: (target, prop) => {
    const source = createAppDataSource();
    return source[prop as keyof DataSource];
  },
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
    const source = createAppDataSource();
    await source.destroy();
    initialized = false;
  }
};

export const db = async () => {
  if (testDataSource) {
    return testDataSource;
  }
  
  if (!initialized) {
    const dbDir = dirname(getDbPath());
    if (!existsSync(dbDir)) {
      await mkdir(dbDir, { recursive: true });
    }
    
    const driver = await loadSqlJsDriver();
    const source = createAppDataSource(driver);
    await source.initialize();
    initialized = true;
  }

  return createAppDataSource();
};

export const resetDatabase = async (): Promise<void> => {
  console.log("🗑️ Resetting database...");
  try {
    const dataSource = await db();
    await dataSource.destroy();
    initialized = false;

    const path = getDbPath();
    if (existsSync(path)) {
      await unlink(path);
    }

    await db();
    console.log("✅ Database reset successfully");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
};

